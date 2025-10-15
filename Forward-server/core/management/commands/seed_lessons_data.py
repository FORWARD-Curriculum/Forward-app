import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.db import transaction, IntegrityError
from django.conf import settings
from django.core.files.storage import default_storage
import boto3 # pyright: ignore[reportMissingImports]
import re

# Import all necessary models, including the ActivityManager
from core.models import (
    Lesson, TextContent, Quiz, Question, Poll, PollQuestion, Writing,
    Identification, Embed, ActivityManager, UserQuizResponse, UserQuestionResponse,
    Concept, ConceptMap
)

# Mapping for deletion order (reverse dependency)
# Add new models here as needed
MODEL_DELETE_ORDER = [
    Question, PollQuestion, UserQuizResponse, UserQuestionResponse, # Responses first if they existed
    Quiz, Poll, Writing, TextContent, Identification, Embed, Concept, ConceptMap, # Activities
    Lesson, # Lesson
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
            help='Delete existing data (matching lesson title) before seeding'
        )

    def handle(self, *args, **options):
        json_file_path = Path(settings.BASE_DIR) / 'core' / 'management' / 'seed_data' / 'lesson_data' / options['json_file']
        self.folder_path = json_file_path.parent
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
                    self.stdout.write(self.style.WARNING('Resetting data for this lesson...'))
                    self._delete_existing_data(lesson_title, activity_manager)

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
        """Deletes data related to the specific lesson title."""
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

    def _create_lesson(self, lesson_data):
        """Creates or updates a lesson."""
        
        if 'image' in lesson_data and lesson_data['image']:
            self.bucket_url_call(lesson_data['image'], key_prefix="lessons/")
            lesson_data['image'] = f"lessons/{lesson_data['image']}"
        
        lesson, created = Lesson.objects.update_or_create(
            title=lesson_data.get('title'),
            defaults={
                'description': lesson_data.get('description', ''),
                'objectives': lesson_data.get('objectives', []),
                'order': lesson_data.get('order'), # Keep lesson order from JSON for now
                'tags': lesson_data.get('tags', []),
                "image": f"public/{lesson_data.get('image')}" if lesson_data.get('image') else None
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
                if activity_type_str == 'dndmatch':  # intermediate parsing
                    self.regex_image_upload(defaults.get(
                        'content', ''), key_prefix="dndmatch/")
                    
                if activity_type_str == 'textcontent' and 'image' in defaults:
                    self.bucket_url_call(defaults.get(
                        'image'), key_prefix="text_content_image/")
                    defaults['image'] = f"public/text_content_image/{defaults['image']}"
                    
                if activity_type_str == 'video':
                    self.bucket_url_call(defaults.get(
                        'video'), key_prefix="video/")
                    defaults['video'] = f"public/video/{defaults['video']}"
                    
                if activity_type_str == 'twine':
                    print(f"DEBUG: Processing Twine activity with file: {defaults.get('file', '')}")
                    raw_html = open(self.folder_path / defaults.get('file', ''), 'r', encoding='utf-8').read()
                    defaults['file'] = raw_html
                    self.regex_image_upload(raw_html, key_prefix="twine/", subfolder="twine/")
                      
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
                
    def regex_image_upload(self, content, key_prefix="", subfolder=""):
        images = re.findall(r"image:(.*?\.(jpe?g|png|gif|bmp|webp|tiff?))", str(content))
        [self.bucket_url_call(f"{subfolder}{m[0]}",key_prefix) for m in images]
        
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

            image_filename = concept_data.get('image')
            self.bucket_url_call(image_filename)
            # Prepare defaults for the Concept model
            concept_defaults = {
                'title': concept_data.get('title', f'Concept {order}'), # Use title from data or default
                'image': f"public/{image_filename}",
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


    # TODO: Change everything to be stored as a KEY not URL, so it is not hardcoded to some bucket

    #Helper method to upload an image file to the bucket
    def _upload_image_to_bucket(self, image_filename, key_prefix=''):
        
        # Url path is constructed over here, 
        final_path = self.folder_path / image_filename
        with open(final_path, 'rb') as f:
            saved_path = default_storage.save(f"public/{key_prefix}{Path(image_filename).name}", f) # the default storage is the s3/minio configured in djanago settings, its uses boto under the hood
            url = default_storage.url(saved_path)
            self.stdout.write(".UPLOADED")
            return url


    def bucket_url_call(self, image_filename, key_prefix=''):
        upload_message = f"  UPLOADING: '{image_filename}' INTO 'public/{key_prefix}'"
        self.stdout.write(f"{upload_message:.<77}", ending="")
        final_s3_key = f"public/{key_prefix}{Path(image_filename).name}"

        try:
            # Use the consistently generated key for the check
            if default_storage.exists(final_s3_key):
                # And use it to generate the URL
                self.stdout.write("CACHE HIT")
                return default_storage.url(final_s3_key)
            else:
                # File doesn't exist, upload it.
                # _upload_image_to_bucket already uses the correct logic.
                return self._upload_image_to_bucket(image_filename, key_prefix)

        # This error would be thrown if no existing bucket.
        # It's better to be more specific with the exception if possible,
        # but for now, this will work with the key fix.
        except Exception:
            self.stdout.write(self.style.ERROR('No bucket found or connection error.'))
            self.stdout.write(self.style.ERROR('Attempting to create bucket...'))

            #Create a minio bucket if this is development mode
            if settings.DEBUG:

                self.stdout.write(self.style.WARNING('Development mode: Creating MinIO bucket'))
                self.create_minio_bucket()
                # Now upload the image after creating the bucket
                return self._upload_image_to_bucket(image_filename, key_prefix)
            else:

                # Production mode, don't try to create buckets. This should be done in AWS first and the 
                # Correct bucket name given to PROD_AWS_MEDIA_BUCKET_NAME in .env variables
                self.stdout.write(self.style.ERROR(
                    f'Production error: Bucket or file access failed for {image_filename}. '
                    'Skipping this image. Please ensure S3 bucket exists and permissions are correct.'
                ))
                return None  
            
    # Creates bucket in development if none has been created yet
    def create_minio_bucket(self):
                
        s3_client = boto3.client(
            's3',
            endpoint_url='http://minio:9000',   # upload endpoint
            aws_access_key_id='minioadmin',   # maybe need to change these to os.getenv
            aws_secret_access_key='minioadmin'  
        )
        bucket_name = settings.STORAGES['default']['OPTIONS']['bucket_name']
        
        
        try:
            s3_client.create_bucket(Bucket=bucket_name)
            self.stdout.write(self.style.SUCCESS(f'Bucket Created: {bucket_name}'))
        except s3_client.exceptions.BucketAlreadyOwnedByYou:
            self.stdout.write(self.style.WARNING(f'Bucket "{bucket_name}" already exists. Continuing.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to create or configure bucket: {e}'))
            raise