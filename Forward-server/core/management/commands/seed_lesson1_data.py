import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.conf import settings
from core.models import User, Lesson, TextContent, Quiz, Question, Poll, PollQuestion, Writing


class Command(BaseCommand):
    help = 'Seeds the database with lesson data from a JSON file'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Delete existing data before seeding')

    def handle(self, *args, **options):
        json_file = Path(settings.BASE_DIR) / 'core' / 'management' / 'seed_data_lesson_1' / 'lesson1_data.json'
        
        # Read the JSON file
        try:
            with open(json_file, 'r', encoding='utf-8') as file:
                data = json.load(file)
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File not found: {json_file}'))
            return
        except json.JSONDecodeError:
            self.stdout.write(self.style.ERROR(f'Invalid JSON in file: {json_file}'))
            return
        
        try:
            with transaction.atomic():
                if options['reset']:
                    self.stdout.write(self.style.WARNING('Deleting existing data...'))
                    # Delete in reverse order to avoid foreign key constraints
                    Question.objects.all().delete()
                    PollQuestion.objects.all().delete()
                    Quiz.objects.all().delete()
                    Poll.objects.all().delete()
                    Writing.objects.all().delete()
                    TextContent.objects.all().delete()
                    Lesson.objects.all().delete()
                    # Keep superuser accounts if they exist
                    User.objects.filter(is_superuser=False).delete()

                # Process users
                user_data = data.get('users', [])
                self._create_users(user_data)

                # Process lesson data
                lesson_data = data.get('lesson', {})
                lesson = self._create_lesson(lesson_data)
                
                # Process text content
                text_contents = data.get('text_contents', [])
                self._create_text_contents(lesson, text_contents)
                
                # Process quizzes
                quizzes = data.get('quizzes', [])
                self._create_quizzes(lesson, quizzes)
                
                # Process poll
                poll_data = data.get('poll')
                if poll_data:
                    self._create_poll(lesson, poll_data)
                
                # Process writing
                writing_data = data.get('writing')
                if writing_data:
                    self._create_writing(lesson, writing_data)
                
                self.stdout.write(self.style.SUCCESS(f'Successfully seeded lesson: {lesson.title}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding database: {str(e)}'))
            raise
    
    def _create_users(self, user_data):
        for data in user_data:
            username = data['username']
            # Hash the password if it's not already hashed
            password = data['password']
            if not password.startswith('pbkdf2_sha256'):
                password = make_password(password)
            
            user, created = User.objects.update_or_create(
                username=username,
                defaults={
                    'password': password,
                    'display_name': data.get('display_name', ''),
                    'facility_id': data.get('last_name', ''),
                    'consent': data.get('consent',False),
                    'profile_picture': data.get('profile_picture',''),
                    'is_staff': data.get('is_staff', False),
                    'is_superuser': data.get('is_superuser', False),
                }
            )
            action = 'Created' if created else 'Updated'
            self.stdout.write(f"{action} user: {user.username}")

    def _create_lesson(self, lesson_data):
        """Create a lesson from the given data"""
        lesson, created = Lesson.objects.update_or_create(
            title=lesson_data.get('title'),
            defaults={
                'description': lesson_data.get('description', ''),
                'objectives': lesson_data.get('objectives', []),
                'order': lesson_data.get('order'),
                'tags': lesson_data.get('tags', [])
            }
        )
        
        action = 'Created' if created else 'Updated'
        self.stdout.write(f"{action} lesson: {lesson.title}")
        return lesson
    
    def _create_text_contents(self, lesson, text_contents):
        """Create text content items for the lesson"""
        for content_data in text_contents:
            text_content, created = TextContent.objects.update_or_create(
                lesson=lesson,
                order=content_data.get('order'),
                defaults={
                    'title': content_data.get('title', ''),
                    'content': content_data.get('content', '')
                }
            )
            
            action = 'Created' if created else 'Updated'
            self.stdout.write(f"{action} text content: {text_content.title}")
    
    def _create_quizzes(self, lesson, quizzes):
        """Create quizzes and their questions for the lesson"""
        for quiz_data in quizzes:
            # Create the quiz
            quiz, created = Quiz.objects.update_or_create(
                lesson=lesson,
                order=quiz_data.get('order'),
                defaults={
                    'title': quiz_data.get('title', ''),
                    'instructions': quiz_data.get('instructions', ''),
                    'passing_score': quiz_data.get('passing_score', 0),
                    'feedback_config': quiz_data.get('feedback_config', {})
                }
            )
            
            action = 'Created' if created else 'Updated'
            self.stdout.write(f"{action} quiz: {quiz.title}")
            
            # Create questions for this quiz
            questions = quiz_data.get('questions', [])
            for question_data in questions:
                question, q_created = Question.objects.update_or_create(
                    quiz=quiz,
                    order=question_data.get('order'),
                    defaults={
                        'question_text': question_data.get('question_text', ''),
                        'question_type': question_data.get('question_type', 'multiple_choice'),
                        'has_correct_answer': question_data.get('has_correct_answer', True),
                        'choices': question_data.get('choices', {}),
                        'is_required': question_data.get('is_required', True),
                        'feedback_config': question_data.get('feedback_config', {})
                    }
                )
                
                q_action = 'Created' if q_created else 'Updated'
                self.stdout.write(f"  {q_action} question: {question.question_text[:50]}...")
    
    def _create_poll(self, lesson, poll_data):
        """Create a poll and its questions for the lesson"""
        # Create the poll
        poll, created = Poll.objects.update_or_create(
            lesson=lesson,
            order=poll_data.get('order'),
            defaults={
                'title': poll_data.get('title', ''),
                'instructions': poll_data.get('instructions', ''),
                'config': poll_data.get('config', {})
            }
        )
        
        action = 'Created' if created else 'Updated'
        self.stdout.write(f"{action} poll: {poll.title}")
        
        # Create poll questions
        questions = poll_data.get('questions', [])
        for question_data in questions:
            poll_question, created = PollQuestion.objects.update_or_create(
                poll=poll,
                order=question_data.get('order'),
                defaults={
                    'question_text': question_data.get('question_text', ''),
                    'options': question_data.get('options', []),
                    'allow_multiple': question_data.get('allow_multiple', False)
                }
            )
            
            q_action = 'Created' if created else 'Updated'
            self.stdout.write(f"  {q_action} poll question: {poll_question.question_text[:50]}...")
    
    def _create_writing(self, lesson, writing_data):
        """Create a writing activity for the lesson"""
        writing, created = Writing.objects.update_or_create(
            lesson=lesson,
            order=writing_data.get('order'),
            defaults={
                'title': writing_data.get('title', ''),
                'instructions': writing_data.get('instructions', ''),
                'prompts': writing_data.get('prompts', [])
            }
        )
        
        action = 'Created' if created else 'Updated'
        self.stdout.write(f"{action} writing activity: {writing.title}")