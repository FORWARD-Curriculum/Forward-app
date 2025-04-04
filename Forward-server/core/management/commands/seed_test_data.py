import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.conf import settings

from core.models import User, Lesson, TextContent, Quiz, Question, Poll, PollQuestion, Writing, Identification

class Command(BaseCommand):
    help = 'Seeds the database with initial data from JSON files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing data before seeding',
        )
        parser.add_argument(
            '--data-dir',
            type=str,
            default='seed_data',
            help='Directory containing JSON seed files (default: seed_data)',
        )

    def handle(self, *args, **options):
        data_dir = options['data_dir']
        seed_path = Path(settings.BASE_DIR) / 'core' / 'management' / data_dir
        
        if not seed_path:
            self.stdout.write(self.style.ERROR(f'Seed data directory not found in: {seed_path}'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'Using seed data from: {seed_path}'))
        
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
                
                # Load and seed data from JSON files
                user_data = self.load_json_file(seed_path / 'users.json')
                self.seed_users(user_data)
                
                lesson_data = self.load_json_file(seed_path / 'lessons.json')
                lessons = self.seed_lessons(lesson_data)
                
                text_content_data = self.load_json_file(seed_path / 'text_content.json')
                self.seed_text_content(text_content_data, lessons)
                
                quiz_data = self.load_json_file(seed_path / 'quizzes.json')
                quizzes = self.seed_quizzes(quiz_data, lessons)
                
                question_data = self.load_json_file(seed_path / 'questions.json')
                self.seed_questions(question_data, quizzes)
                
                poll_data = self.load_json_file(seed_path / 'polls.json')
                polls = self.seed_polls(poll_data, lessons)
                
                poll_question_data = self.load_json_file(seed_path / 'poll_questions.json')
                self.seed_poll_questions(poll_question_data, polls)
                
                identification_question_data = self.load_json_file(seed_path / 'identifications.json')
                identifications = self.seed_identifications(identification_question_data, lessons)

                self.stdout.write(self.style.SUCCESS('Successfully seeded database'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding database: {str(e)}'))
            raise
    
    def load_json_file(self, file_path):
        """Load data from a JSON file"""
        try:
            with open(file_path, 'r') as file:
                return json.load(file)
        except FileNotFoundError:
            self.stdout.write(self.style.WARNING(f'File not found: {file_path}'))
            return []
        except json.JSONDecodeError:
            self.stdout.write(self.style.ERROR(f'Invalid JSON in file: {file_path}'))
            return []

    def seed_users(self, user_data):
        self.stdout.write('Seeding users...')
        
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
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{status}: {username}'))

    def seed_lessons(self, lesson_data):
        self.stdout.write('Seeding lessons...')
        
        lessons = {}
        for data in lesson_data:
            title = data['title']
            lesson, created = Lesson.objects.update_or_create(
                title=title,
                defaults={
                    'description': data.get('description', ''),
                    'objectives': data.get('objectives', []),
                    'order': data.get('order', 0),
                    'tags': data.get('tags', []),
                }
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{status}: {title}'))
            lessons[title] = lesson
            
        return lessons
    
    def seed_text_content(self, text_content_data, lessons):
        self.stdout.write('Seeding text content...')
        
        for data in text_content_data:
            title = data['title']
            lesson_title = data['lesson']
            
            if lesson_title not in lessons:
                self.stdout.write(self.style.ERROR(f'Lesson not found: {lesson_title}'))
                continue
                
            content, created = TextContent.objects.update_or_create(
                lesson=lessons[lesson_title],
                title=title,
                defaults={
                    'content': data.get('content', ''),
                    'order': data.get('order', 0),
                }
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{status}: {title}'))
    
    def seed_identifications(self, identification_data, lessons):
        for data in identification_data:
            title = data['title']
            lesson_title = data['lesson']
            instructions = data.get('instructions', '')
            
            if lesson_title not in lessons:
                self.stdout.write(self.style.ERROR(f'Lesson not found: {lesson_title}'))
                continue
                
            content, created = Identification.objects.update_or_create(
                lesson=lessons[lesson_title],
                title=title,
                instructions = data.get('instructions', ''),
                defaults={
                    'content': data.get('content', ''),
                    'order': data.get('order', 0),
                }
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{status}: Identification - {title}'))
    
    def seed_quizzes(self, quiz_data, lessons):
        self.stdout.write('Seeding quizzes...')
        
        quizzes = {}
        for data in quiz_data:
            title = data['title']
            lesson_title = data['lesson']
            
            if lesson_title not in lessons:
                self.stdout.write(self.style.ERROR(f'Lesson not found: {lesson_title}'))
                continue
                
            quiz, created = Quiz.objects.update_or_create(
                lesson=lessons[lesson_title],
                title=title,
                defaults={
                    'instructions': data.get('instructions', ''),
                    'order': data.get('order', 0),
                    'passing_score': data.get('passing_score', 0),
                    'feedback_config': data.get('feedback_config', {}),
                }
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{status}: {title}'))
            quizzes[title] = quiz
            
        return quizzes
    
    def seed_questions(self, question_data, quizzes):
        self.stdout.write('Seeding quiz questions...')
        
        for data in question_data:
            question_text = data['question_text']
            quiz_title = data['quiz']
            
            if quiz_title not in quizzes:
                self.stdout.write(self.style.ERROR(f'Quiz not found: {quiz_title}'))
                continue
                
            question, created = Question.objects.update_or_create(
                quiz=quizzes[quiz_title],
                question_text=question_text,
                defaults={
                    'question_type': data.get('question_type', 'multiple_choice'),
                    'has_correct_answer': data.get('has_correct_answer', True),
                    'choices': data.get('choices', {}),
                    'is_required': data.get('is_required', True),
                    'order': data.get('order', 0),
                    'feedback_config': data.get('feedback_config', {}),
                }
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{status}: Question - {question_text[:30]}...'))
    
    def seed_polls(self, poll_data, lessons):
        self.stdout.write('Seeding polls...')
        
        polls = {}
        for data in poll_data:
            title = data['title']
            lesson_title = data['lesson']
            
            if lesson_title not in lessons:
                self.stdout.write(self.style.ERROR(f'Lesson not found: {lesson_title}'))
                continue
                
            poll, created = Poll.objects.update_or_create(
                lesson=lessons[lesson_title],
                title=title,
                defaults={
                    'instructions': data.get('instructions', ''),
                    'order': data.get('order', 0),
                    'config': data.get('config', {}),
                }
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{status}: {title}'))
            polls[title] = poll
            
        return polls
        
    def seed_poll_questions(self, poll_question_data, polls):
        self.stdout.write('Seeding poll questions...')
        
        for data in poll_question_data:
            question_text = data['question_text']
            poll_title = data['poll']
            
            if poll_title not in polls:
                self.stdout.write(self.style.ERROR(f'Poll not found: {poll_title}'))
                continue
                
            question, created = PollQuestion.objects.update_or_create(
                poll=polls[poll_title],
                question_text=question_text,
                defaults={
                    'options': data.get('options', []),
                    'allow_multiple': data.get('allow_multiple', False),
                    'order': data.get('order', 0),
                }
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{status}: Poll Question - {question_text[:30]}...'))