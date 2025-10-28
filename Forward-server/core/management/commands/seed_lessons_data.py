import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.db import transaction, IntegrityError
from django.conf import settings
from django.core.files.storage import default_storage
import boto3 # pyright: ignore[reportMissingImports]
import re
from django.core.files import File

# Import all necessary models, including the ActivityManager
from core.models import (
    Lesson, TextContent, Quiz, Question, Poll, PollQuestion, Writing,
    Identification, Embed, ActivityManager, UserQuizResponse, UserQuestionResponse,
    Concept, ConceptMap, BaseActivity
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
        
        # Pop the image filename from the data to handle it separately.
        image_filename = lesson_data.pop('image', None)
        
        # Create or update the lesson with all non-file data first.
        lesson, created = Lesson.objects.update_or_create(
            title=lesson_data.get('title'),
            defaults=lesson_data # The rest of the data serves as defaults
        )
        
        # If an image filename was provided, open the file and save it to the ImageField.
        if image_filename:
            image_path = self.folder_path / image_filename
            try:
                with open(image_path, 'rb') as image_file:
                    # The .save() method on the field handles the storage and updates the model.
                    lesson.image.save(Path(image_filename).name, File(image_file), save=True)
            except FileNotFoundError:
                self.stdout.write(self.style.ERROR(f"  Image file not found: {image_path}. Lesson saved without image."))
        
        action = 'Created' if created else 'Updated'
        self.stdout.write(f"{action} lesson: {lesson.title}")
        return lesson

    def _create_activities(self, lesson, activities_data, activity_manager):
        """Creates activities using the ActivityManager, deriving order from list position."""
        for order, activity_data in enumerate(activities_data, start=1):
            current_activity_data = activity_data.copy()
            activity_type_str = current_activity_data.pop('type', '').lower()

            if not activity_type_str or activity_type_str not in activity_manager.registered_activities:
                self.stdout.write(self.style.WARNING(f"Skipping activity at position {order} with invalid or missing type: '{activity_type_str}'"))
                continue

            ActivityModel, _, _, is_child, _ = activity_manager.registered_activities[activity_type_str]
            if is_child:
                continue
            
            ActivityModel: BaseActivity = ActivityModel

            # Pop child data and file data before preparing defaults
            questions_data = current_activity_data.pop('questions', None) if activity_type_str in ['quiz', 'poll'] else None
            concepts_data = current_activity_data.pop('examples', None) if activity_type_str == 'conceptmap' else None

            # Base defaults for the activity model
            defaults = {
                'title': current_activity_data.pop('title', f'{activity_type_str.capitalize()} Activity {order}'),
                'instructions': current_activity_data.pop('instructions', None),
                **current_activity_data
            }
            
            # --- Pop file field data to be handled after object creation ---
            image_filename = defaults.pop('image', None) if activity_type_str == 'textcontent' else None
            video_filename = defaults.pop('video', None) if activity_type_str == 'video' else None
            twine_filename = defaults.pop('file', None) if activity_type_str == 'twine' else None

            # Handle special cases for content that might contain image references
            if activity_type_str == 'textcontent' and not image_filename:
                images = re.findall(r"!\[.*\]\((.*)\)", str(defaults.get('content', '')))
                if images:
                    image_filename = images[0]
                    defaults['content'] = re.sub(r"!\[.*\]\(.*\)", "", defaults.get('content', ''), count=1).strip()
            
            if activity_type_str == 'dndmatch':
                for group in defaults.get('content',[]):
                    for match in group.get('matches',[]):
                        if type(match) != str:
                            image_rel = match["image"]
                            with open(self.folder_path / image_rel, 'rb') as image:
                                name = default_storage.save(f"public/dndmatch/images/{image_rel}", image)
                                match["image"] = name
                                
                self.regex_image_upload(defaults.get('content', ''), key_prefix="dndmatch/")
            
            if activity_type_str == 'twine' and twine_filename:
                twine_path = self.folder_path / twine_filename
                try:
                    with open(twine_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        image_tuples = re.findall(r"image:(.*?\.(jpe?g|png|gif|bmp|webp|tiff?))", content)
                        for image_info_tuple in image_tuples:
                            relative_image_path = image_info_tuple[0].strip()
                            local_image_full_path = self.folder_path / 'twine' / relative_image_path
                            try:
                                with open(local_image_full_path, 'rb') as image_file:
                                    s3_filename = Path(relative_image_path).name
                                    default_storage.save(f"public/twine/images/{s3_filename}", image_file)
                                    self.stdout.write(f"  Uploaded Twine sub-asset: {relative_image_path}")
                            except Exception as e:
                                self.stdout.write(self.style.ERROR(f"Referenced twine image: '{relative_image_path}' not found at: {local_image_full_path}. Skipping..."))
                                continue
                                

                except FileNotFoundError:
                    self.stdout.write(self.style.ERROR(f"Twine file not found for regex processing: {twine_path}"))
                    twine_filename = None # Prevent upload if source is missing

            # Clean defaults of None values unless the field allows it
            model_fields = {f.name: f for f in ActivityModel._meta.get_fields()}
            defaults = {k: v for k, v in defaults.items() if k in model_fields and (v is not None or getattr(model_fields[k], 'null', False))}

            try:
                activity_obj, created = ActivityModel.objects.update_or_create(
                    lesson=lesson,
                    order=order,
                    defaults=defaults
                )
                action = 'Created' if created else 'Updated'
                self.stdout.write(f"{action} {activity_type_str} (Order: {order}): {activity_obj.title}")

                # --- Handle FileField/ImageField uploads using default storage ---
                file_to_upload = None
                field_name = None
                if activity_type_str == 'textcontent' and image_filename:
                    file_to_upload, field_name = image_filename, 'image'
                elif activity_type_str == 'video' and video_filename:
                    file_to_upload, field_name = video_filename, 'video'
                elif activity_type_str == 'twine' and twine_filename:
                    file_to_upload, field_name = twine_filename, 'file'

                if file_to_upload and field_name:
                    file_path = self.folder_path / file_to_upload
                    try:
                        with open(file_path, 'rb') as f:
                            getattr(activity_obj, field_name).save(Path(file_to_upload).name, File(f), save=True)
                            self.stdout.write(f"  Uploaded {ActivityModel} asset: {file_to_upload}")
                    except FileNotFoundError:
                        self.stdout.write(self.style.ERROR(f"  File not found: {file_path}"))

                # --- Handle Child Objects ---
                if activity_type_str == 'quiz' and questions_data:
                    self._create_questions(activity_obj, questions_data)
                elif activity_type_str == 'poll' and questions_data:
                    self._create_poll_questions(activity_obj, questions_data)
                elif activity_type_str == 'conceptmap' and concepts_data:
                    self._create_concepts(activity_obj, concepts_data)

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to create/update {activity_type_str} (Order: {order}): {e}"))
                import traceback
                traceback.print_exc()
                
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
        self.stdout.write(f"  Processing {len(concepts_data)} concepts for concept map: {concept_map.title}")
        for order, concept_data in enumerate(concepts_data, start=1):
            
            # Pop the main image to handle with the ImageField's storage
            image_filename = concept_data.pop('image', None)
            
            # Process images within the 'examples' JSON field using the bucket helper
            examples = concept_data.get('examples', [])
            for example in examples:
                example_image = example.get('image')
                if example_image:
                    try:
                        self.bucket_url_call(example_image, key_prefix="concept/")
                        example['image'] = f"public/concept/{example_image}" # Keep storing the path in JSON
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"    Failed to upload example image '{example_image}': {e}"))
                        example['image'] = None
            
            # Prepare defaults for the Concept model
            concept_defaults = {
                'title': concept_data.get('title', f'Concept {order}'),
                'description': concept_data.get('description', ''),
                'examples': examples,
                'instructions': concept_data.get('instructions'),
            }
            model_fields = {f.name: f for f in Concept._meta.get_fields()}
            concept_defaults = {k: v for k, v in concept_defaults.items() if k in model_fields and (v is not None or getattr(model_fields[k], 'null', False))}

            try:
                concept, c_created = Concept.objects.update_or_create(
                    concept_map=concept_map,
                    lesson=concept_map.lesson,
                    order=order,
                    defaults=concept_defaults
                )

                # After creating the concept, save the image file to its ImageField
                if image_filename:
                    image_path = self.folder_path / image_filename
                    try:
                        with open(image_path, 'rb') as image_file:
                            concept.image.save(Path(image_filename).name, File(image_file), save=True)
                    except FileNotFoundError:
                        self.stdout.write(self.style.ERROR(f"    Image file not found for concept: {image_path}"))

                c_action = 'Created' if c_created else 'Updated'
                self.stdout.write(f"    {c_action} concept (Order: {order}): {concept.title[:50]}...")
            except Exception as e:
                 self.stdout.write(self.style.ERROR(f"    Failed to create/update concept (Order: {order}) for '{concept_map.title}': {e}"))
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