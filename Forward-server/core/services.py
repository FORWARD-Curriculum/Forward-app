# Business logic
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, Lesson, TextContent, Quiz, Question, Poll, PollQuestion, Writing, UserQuizResponse, UserQuestionResponse

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
                        'text_size': user.text_size,
                        'speech_uri_index': user.speech_uri_index,
                        'speech_speed': user.speech_speed
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

        lesson_dict['activities'] = {}
        
        # Process text content
        text_contents = list(TextContent.objects.filter(lesson_id=lesson_id).order_by('order'))
        for content in text_contents:
            activity_dict = content.to_dict()
            lesson_dict['activities'][content.order] = activity_dict

        # Process quizzes
        for quiz in Quiz.objects.filter(lesson_id=lesson_id).order_by('order'):
            questions = Question.objects.filter(quiz_id=quiz.id).order_by('order')
            quiz_dict = quiz.to_dict()
            quiz_dict['questions'] = [q.to_dict() for q in questions]
            lesson_dict['activities'][quiz.order] = quiz_dict

        # Process polls
        for poll in Poll.objects.filter(lesson_id=lesson_id).order_by('order'):
            poll_questions = PollQuestion.objects.filter(poll_id=poll.id).order_by('order')
            poll_dict = poll.to_dict()
            poll_dict['questions'] = [pq.to_dict() for pq in poll_questions]
            lesson_dict['activities'][poll.order] = poll_dict

        # Process writing activities
        writing_activities = list(Writing.objects.filter(lesson_id=lesson_id))
        for writing in writing_activities:
            writing_dict = writing.to_dict()
            lesson_dict['activities'][writing.order] = writing_dict
            
        lesson_dict['activities'] = list(lesson_dict['activities'].values())

        return {
            "lesson": lesson_dict
        }
    
class QuizResponseService:
    @staticmethod
    @transaction.atomic
    def submit_quiz_response(user: User, data: dict):
        """
        Process a user's quiz submission

        Args:
            user: The user submitting the quiz
            data: Dictionary containing quiz submission data (validated by serializer)

        Returns:
            UserQuizResponse: The created/updated quiz response object
        """
        quiz_id = data.get('quiz_id')
        is_complete = data.get('is_complete', True)
        question_responses_data = data.get('question_responses', [])

        # Get or create a quiz response object
        quiz_response, created = UserQuizResponse.objects.get_or_create(
            user=user,
            quiz_id=quiz_id,
            defaults={'is_complete': False}
        )

        # If quiz is being completed, update completion status and time
        if is_complete and not quiz_response.is_complete:
            quiz_response.is_complete = True
            quiz_response.completed_at = timezone.now()

        # If the quiz response is new it needs an ID, so save it now
        quiz_response.save()

        # Process each question response
        for response_data in question_responses_data:
            question_id = response_data.get('question_id')
            response_content = response_data.get('response_data')

            # Create or update the question response
            question_response, _ = UserQuestionResponse.objects.update_or_create(
                quiz_response=quiz_response,
                question_id=question_id,
                defaults={'response_data': response_content}
            )

            # Check correctness
            question_response.evaluate_correctness()

        # Calculate score if complete
        if quiz_response.is_complete:
            quiz_response.calculate_score()

        return quiz_response
    
    @staticmethod
    def get_user_quiz_responses(user, quiz_id=None):
        """
        Get a user's responses to quizzes.

        Args:
            user: The user whose responses to retrieve
            quiz_id: Optional quiz ID to filter by

        Returns:
            QuerySet: User's quiz responses
        """
        if quiz_id:
            return UserQuizResponse.objects.filter(user=user, quiz_id=quiz_id)
        return UserQuizResponse.objects.filter(user=user)
    
    @staticmethod
    def get_quiz_response_details(user, response_id):
        """
        Get detailed information about a quiz response.
        
        Args:
            user: The user who submitted the response
            response_id: ID of the quiz response
            
        Returns:
            UserQuizResponse: The quiz response with question responses
            
        Raises:
            UserQuizResponse.DoesNotExist: If the response doesn't exist or belong to the user
        """
        return UserQuizResponse.objects.get(id=response_id, user=user)