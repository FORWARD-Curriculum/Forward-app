# Business logic
from django.db import transaction
from django.contrib.auth import login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, Lesson, TextContent, Quiz, Question, Poll, PollQuestion, Writing

class UserService:
    @staticmethod
    @transaction.atomic
    def create_user(data: dict):
        """
        Create a new user with validated data
        
        Args:
            data (dict): Dictionary containing user data including:
                        username, password, email, display_name, facility_id, profile_picture, consent
        
        Returns:
            User: Created user instance
            
        Raises:
            ValidationError: If password validation fails or required fields are missing
        """
        try:
            # Validate password
            validate_password(data['password'])
            
            # Create user instance but don't save yet
            user = User(
                username=data['username'],
                display_name=data['display_name'],
            )
            
            # Set password (this handles the hashing)
            user.set_password(data['password'])
            
            # Save the user
            user.save()
            
            return user
        except ValidationError as e:
            raise ValidationError({'password': e.messages})
        except KeyError as e:
            raise ValidationError(f'Missing required field: {str(e)}')
        
    @staticmethod
    def login_user(request, user: User):
        """
        Log in a user and create a session
        
        Args:
            request: The HTTP request object
            user: The authenticated user instance
            
        Returns:
            dict: User data including authentication token if used

        Raises:
            ValidationError: If login fails
        """
        try:
            # Log the user in (validates with HTTP session storage)
            login(request, user)

            return {
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'display_name': user.display_name,
                    'facility_id': user.facility_id,
                    'profile_picture': user.profile_picture,
                    'consent': user.consent,
                    'preferences': {
                        'theme': user.theme,
                        'text_size': user.text_size
                    }
                }
            }
        except Exception as e:
            raise ValidationError('login failed. Please try again.')
        
    @staticmethod
    def logout_user(request):
        """
        Log out a user and destroy the session
        
        Args:
            request: The HTTP request object
            
        Returns:
            dict: User data including authentication token if used
        """
        try:
            # Log the user out (validates with HTTP session storage)
            logout(request)
        except Exception as e:
            raise ValidationError('logout failed. Please try again.')
        
class LessonService:
    @staticmethod
    def get_lesson_content(lesson_id):
        """
        Retrieve all content associated with a lesson.
        
        Args:
            lesson_id (int): The ID of the lesson
            
        Returns:
            dict: All content associated with the lesson
            
        Raises:
            Lesson.DoesNotExist: If the lesson doesn't exist
        """
        lesson = Lesson.objects.get(id=lesson_id)
        lesson_dict = lesson.to_dict()

        text_contents = TextContent.objects.filter(lesson_id=lesson_id).order_by('order')

        quizzes = []
        for quiz in Quiz.objects.filter(lesson_id=lesson_id).order_by('order'):
            questions = Question.objects.filter(quiz_id=quiz.id).order_by('order')
            quizzes.append({
                "quiz": quiz.to_dict(),
                "questions": [q.to_dict() for q in questions]
            })

        polls = []
        for poll in Poll.objects.filter(lesson_id=lesson_id).order_by('order'):
            poll_questions = PollQuestion.objects.filter(id=poll.id).order_by('order')
            polls.append({
                "poll": poll.to_dict(),
                "questions": [q.to_dict() for q in poll_questions]
            })

        writing_activities = Writing.objects.filter(lesson_id=lesson_id)

        lesson_dict['text_contents'] = [t.to_dict() for t in text_contents]
        lesson_dict['quizzes'] = quizzes
        lesson_dict['polls'] = polls
        lesson_dict['writings'] = [w.to_dict() for w in writing_activities]

        return {
            "lesson": lesson_dict
        }