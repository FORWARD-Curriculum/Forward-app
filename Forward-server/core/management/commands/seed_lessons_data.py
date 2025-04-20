import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.db import transaction, IntegrityError
from django.conf import settings
# Import all necessary models, including the ActivityManager
from core.models import (
    User, Lesson, TextContent, Quiz, Question, Poll, PollQuestion, Writing,
    Identification, Embed, ActivityManager, UserQuizResponse, UserQuestionResponse,
    Concept, ConceptMap
)

# Mapping for deletion order (reverse dependency)
# Add new models here as needed
MODEL_DELETE_ORDER = [
    Question, PollQuestion, UserQuizResponse, UserQuestionResponse, # Responses first if they existed
    Quiz, Poll, Writing, TextContent, Identification, Embed, Concept, ConceptMap, # Activities
    Lesson, # Lesson
    User, # User (excluding superusers)
]

class Command(BaseCommand):
    help = 'Seeds the database with lesson data from a JSON file using ActivityManager'

    def add_arguments(self, parser):
        parser.add_argument(
            'json_file',
            type=str,
            help='Path to the JSON file containing seed data relative to BASE_DIR'
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing data (matching lesson title and non-superusers) before seeding'
        )

    def handle(self, *args, **options):
        json_file_path = Path(settings.BASE_DIR) / 'core' / 'management' / options['json_file']
        activity_manager = ActivityManager() # Get the singleton instance

        # Read the JSON file
        try:
            with open(json_file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File not found: {json_file_path}'))
            return
        except json.JSONDecodeError:
            self.stdout.write(self.style.ERROR(f'Invalid JSON in file: {json_file_path}'))
            return

        lesson_data = data.get('lesson', {})
        lesson_title = lesson_data.get('title')
        if not lesson_title:
            self.stdout.write(self.style.ERROR('JSON data must contain a "lesson" object with a "title".'))
            return

        try:
            with transaction.atomic():
                if options['reset']:
                    self.stdout.write(self.style.WARNING('Resetting data for this lesson and non-superusers...'))
                    self._delete_existing_data(lesson_title, activity_manager)

                # Process users
                user_data = data.get('users', [])
                self._create_users(user_data)

                # Process lesson data
                lesson = self._create_lesson(lesson_data)

                # Process activities using ActivityManager
                activities_data = data.get('activities', [])
                self._create_activities(lesson, activities_data, activity_manager)

                self.stdout.write(self.style.SUCCESS(f'Successfully seeded lesson: {lesson.title}'))
        except IntegrityError as e:
             self.stdout.write(self.style.ERROR(f'Database integrity error: {str(e)}. Perhaps run with --reset?'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding database: {str(e)}'))
            import traceback
            traceback.print_exc() # Print full traceback for debugging
            # Reraise to ensure transaction rollback on error
            raise

    def _delete_existing_data(self, lesson_title, activity_manager):
        """Deletes data related to the specific lesson title and non-superuser users."""
        # Find the lesson to delete (if it exists)
        lesson_to_delete = Lesson.objects.filter(title=lesson_title).first()

        if lesson_to_delete:
            self.stdout.write(f"Deleting activities for lesson: {lesson_title} (ID: {lesson_to_delete.id})")
            # Delete activities associated with this lesson using ActivityManager types
            for activity_key, (ModelClass, _, _, _, _) in activity_manager.registered_activities.items():
                 # Skip abstract or child models that don't have direct lesson FK or own table
                if not hasattr(ModelClass, '_meta') or (hasattr(ModelClass._meta, 'abstract') and ModelClass._meta.abstract):
                    continue
                if activity_key in ["question", "pollquestion"]: # Handled by Quiz/Poll deletion cascade
                     continue

                # Check if the model has a 'lesson' field
                if hasattr(ModelClass, 'lesson'):
                    deleted_count, _ = ModelClass.objects.filter(lesson=lesson_to_delete).delete()
                    if deleted_count:
                        self.stdout.write(f"  Deleted {deleted_count} {ModelClass.__name__} objects.")
                else:
                     # Handle models like Question/PollQuestion indirectly if needed,
                     # but CASCADE delete should handle most cases.
                     # Quiz/Poll deletion will cascade to Questions/PollQuestions.
                     pass # Usually handled by cascade

            # Delete the lesson itself
            lesson_to_delete.delete()
            self.stdout.write(f"Deleted lesson: {lesson_title}")
        else:
            self.stdout.write(f"Lesson '{lesson_title}' not found, skipping lesson/activity deletion.")

        # Delete non-superuser users (be careful with this in production)
        deleted_users, _ = User.objects.filter(is_superuser=False).delete()
        if deleted_users:
            self.stdout.write(f"Deleted {deleted_users} non-superuser User objects.")

    def _create_users(self, user_data):
        """Creates or updates users from the provided data."""
        for data in user_data:
            username = data.get('username')
            if not username:
                self.stdout.write(self.style.WARNING("Skipping user entry with no username."))
                continue

            password = data.get('password', 'password') # Default password if not provided
            # Hash the password if it's plain text
            if not password.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2$')):
                password = make_password(password)

            defaults = {
                'password': password,
                'display_name': data.get('display_name', username), # Default display name to username
                'facility_id': data.get('facility_id'), # Use get for optional fields
                'consent': data.get('consent', False),
                'profile_picture': data.get('profile_picture'),
                'theme': data.get('theme', 'light'),
                'text_size': data.get('text_size', 'txt-base'),
                'speech_uri_index': data.get('speech_uri_index'),
                'speech_speed': data.get('speech_speed'),
                'is_staff': data.get('is_staff', False),
                'is_superuser': data.get('is_superuser', False),
                'email': data.get('email') # Add email if present in JSON
            }
            # Remove None values from defaults to avoid overriding existing DB defaults unnecessarily
            defaults = {k: v for k, v in defaults.items() if v is not None}

            user, created = User.objects.update_or_create(
                username=username,
                defaults=defaults
            )
            action = 'Created' if created else 'Updated'
            self.stdout.write(f"{action} user: {user.username}")

    def _create_lesson(self, lesson_data):
        """Creates or updates a lesson."""
        lesson, created = Lesson.objects.update_or_create(
            title=lesson_data.get('title'),
            defaults={
                'description': lesson_data.get('description', ''),
                'objectives': lesson_data.get('objectives', []),
                'order': lesson_data.get('order'), # Keep lesson order from JSON for now
                'tags': lesson_data.get('tags', [])
            }
        )
        action = 'Created' if created else 'Updated'
        self.stdout.write(f"{action} lesson: {lesson.title}")
        return lesson

    def _create_activities(self, lesson, activities_data, activity_manager):
        """Creates activities using the ActivityManager, deriving order from list position."""
        # Use enumerate to get the index (order), starting from 1
        for order, activity_data in enumerate(activities_data, start=1):
            # Make a copy to avoid modifying the original dict if needed elsewhere
            current_activity_data = activity_data.copy()

            activity_type_str = current_activity_data.pop('type', None)
            if not activity_type_str:
                self.stdout.write(self.style.WARNING(f"Skipping activity entry at position {order} with no 'type' specified."))
                continue

            activity_type_str = activity_type_str.lower() # Ensure lowercase key

            if activity_type_str not in activity_manager.registered_activities:
                self.stdout.write(self.style.WARNING(f"Skipping unknown activity type '{activity_type_str}' at position {order}"))
                continue

            ActivityModel, _, nonstandard_fields, is_child, _ = activity_manager.registered_activities[activity_type_str]

            # Skip child types that should be created under their parents
            if is_child:
                continue

            # Explicitly pop child data *before* creating the parent defaults
            questions_data = None
            poll_questions_data = None
            concepts_data = None
            if activity_type_str == 'quiz':
                # Pop 'questions' from the data intended for the Quiz model defaults
                questions_data = current_activity_data.pop('questions', None)
            elif activity_type_str == 'poll':
                 # Pop 'questions' from the data intended for the Poll model defaults
                poll_questions_data = current_activity_data.pop('questions', None)
            elif activity_type_str == 'conceptmap':
                concepts_data = current_activity_data.pop('examples', None)

            # Base defaults common to most BaseActivity children
            defaults = {
                'title': current_activity_data.pop('title', f'{activity_type_str.capitalize()} Activity {order}'), # Add order to default title
                'instructions': current_activity_data.pop('instructions', None),
                # Now 'questions' key (if it existed) is NOT in current_activity_data when unpacked
                **current_activity_data # Add remaining fields from JSON
            }

            # Remove None values from defaults unless the field explicitly allows null=True
            model_fields = {f.name: f for f in ActivityModel._meta.get_fields()}
            defaults = {
                k: v for k, v in defaults.items()
                if k in model_fields and (v is not None or getattr(model_fields[k], 'null', False))
            }

            try:
                # Use the 'order' from enumerate in update_or_create
                activity_obj, created = ActivityModel.objects.update_or_create(
                    lesson=lesson,
                    order=order, # Use the order derived from list position
                    defaults=defaults
                )
                action = 'Created' if created else 'Updated'
                self.stdout.write(f"{action} {activity_type_str} (Order: {order}): {activity_obj.title}")

                # --- Handle Child Objects (Questions/PollQuestions) ---
                # Use the popped data here
                if activity_type_str == 'quiz' and questions_data: # Check if we popped data earlier
                     self._create_questions(activity_obj, questions_data)
                elif activity_type_str == 'poll' and poll_questions_data: # Check if we popped data earlier
                    self._create_poll_questions(activity_obj, poll_questions_data)
                elif activity_type_str == 'conceptmap' and concepts_data:
                     self._create_concepts(activity_obj, concepts_data)

            except Exception as e:
                # Include the derived order in the error message
                self.stdout.write(self.style.ERROR(f"Failed to create/update {activity_type_str} (Order: {order}): {e}"))
                import traceback
                traceback.print_exc() # Print full traceback for debugging
                # Depending on desired behavior. For seeding, maybe log and continue.
                # raise # Uncomment to stop on first error

    def _create_questions(self, quiz, questions_data):
        """Creates or updates questions for a given quiz, deriving order from list position."""
        self.stdout.write(f"  Processing {len(questions_data)} questions for quiz: {quiz.title}") # Debug print
        # Use enumerate to get the index (order), starting from 1
        for order, question_data in enumerate(questions_data, start=1):
            # Prepare defaults for the Question model
            # No need to get 'order' from question_data anymore
            question_defaults = {
                'question_text': question_data.get('question_text', ''),
                'question_type': question_data.get('question_type', 'multiple_choice'),
                'has_correct_answer': question_data.get('has_correct_answer', True),
                'choices': question_data.get('choices', {}),
                'is_required': question_data.get('is_required', True),
                'feedback_config': question_data.get('feedback_config', {})
            }

            try:
                # Use the 'order' from enumerate in update_or_create
                question, q_created = Question.objects.update_or_create(
                    quiz=quiz, # Link to the parent quiz
                    order=order, # Use the order derived from list position
                    defaults=question_defaults
                )
                q_action = 'Created' if q_created else 'Updated'
                self.stdout.write(f"    {q_action} question (Order: {order}): {question.question_text[:50]}...")
            except Exception as e:
                 # Include the derived order in the error message
                 self.stdout.write(self.style.ERROR(f"    Failed to create/update question (Order: {order}) for quiz '{quiz.title}': {e}"))


    def _create_poll_questions(self, poll, questions_data):
        """Creates or updates questions for a given poll, deriving order from list position."""
        self.stdout.write(f"  Processing {len(questions_data)} questions for poll: {poll.title}") # Debug print
        # Use enumerate to get the index (order), starting from 1
        for order, question_data in enumerate(questions_data, start=1):
            # Prepare defaults for the PollQuestion model
            # No need to get 'order' from question_data anymore
            poll_question_defaults={
                'question_text': question_data.get('question_text', ''),
                'options': question_data.get('options', []),
                'allow_multiple': question_data.get('allow_multiple', False)
            }

            try:
                # Use the 'order' from enumerate in update_or_create
                poll_question, pq_created = PollQuestion.objects.update_or_create(
                    poll=poll, # Link to the parent poll
                    order=order, # Use the order derived from list position
                    defaults=poll_question_defaults
                )
                pq_action = 'Created' if pq_created else 'Updated'
                self.stdout.write(f"    {pq_action} poll question (Order: {order}): {poll_question.question_text[:50]}...")
            except Exception as e:
                 # Include the derived order in the error message
                 self.stdout.write(self.style.ERROR(f"    Failed to create/update poll question (Order: {order}) for poll '{poll.title}': {e}"))

    def _create_concepts(self, concept_map, concepts_data):
        """Creates or updates concepts for a given concept map, deriving order from list position."""
        self.stdout.write(f"  Processing {len(concepts_data)} concepts for concept map: {concept_map.title}") # Debug print
        # Use enumerate to get the index (order), starting from 1
        for order, concept_data in enumerate(concepts_data, start=1):
            # Prepare defaults for the Concept model
            concept_defaults = {
                'title': concept_data.get('title', f'Concept {order}'), # Use title from data or default
                'image': concept_data.get('image'),
                'description': concept_data.get('description', ''),
                'examples': concept_data.get('examples', []),
                # Instructions might be on concept_data or inherit from BaseActivity defaults
                'instructions': concept_data.get('instructions'),
            }
            # Remove None values unless the field explicitly allows null=True
            model_fields = {f.name: f for f in Concept._meta.get_fields()}
            concept_defaults = {k: v for k, v in concept_defaults.items() if k in model_fields and (v is not None or getattr(model_fields[k], 'null', False))}

            try:
                # Use the 'order' from enumerate in update_or_create
                concept, c_created = Concept.objects.update_or_create(
                    concept_map=concept_map, # Link to the parent concept map
                    lesson=concept_map.lesson, # Link to the same lesson as the map
                    order=order, # Use the order derived from list position
                    defaults=concept_defaults
                )
                c_action = 'Created' if c_created else 'Updated'
                self.stdout.write(f"    {c_action} concept (Order: {order}): {concept.title[:50]}...")
            except Exception as e:
                 # Include the derived order in the error message
                 self.stdout.write(self.style.ERROR(f"    Failed to create/update concept (Order: {order}) for concept map '{concept_map.title}': {e}"))