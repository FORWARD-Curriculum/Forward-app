# Business logic
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, Lesson, TextContent, Quiz, Question, Poll, PollQuestion, Writing, UserQuizResponse, UserQuestionResponse, TextContentResponse, PollQuestionResponse, WritingResponse

class UserService:
    @staticmethod
    @transaction.atomic
    def create_user(data: dict):
        """
        Create a new user with validated data
        
        Args:
            data (dict): Dictionary containing user data including:
                        username, password, email, display_name, facility_id, consent
        
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

            # Set additional fields
            if 'facility_id' in data:
                user.facility_id = data['facility_id']

            if 'consent' in data:
                user.consent = data['consent']
            
            # Set password (this handles the hashing)
            user.set_password(data['password'])

            # Validate all fields according to model constraints
            user.full_clean()
            
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
        
class ResponseService:
    @staticmethod
    def get_response_data(lesson_id, user):
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
        
        out_dict = {} 
        out_dict['lessonId'] = lesson.id
        out_dict['responseData'] = {}
        
        out_dict['responseData']['TextContent'] = [a.to_dict() for a in list(TextContentResponse.objects.filter(lesson=lesson,user=user))]
        out_dict['responseData']['Quiz'] = []#[a.to_dict() for a in list(QuizResponse.objects.filter(lesson=lesson,user=user))]
        out_dict['responseData']['Question'] = []#[a.to_dict() for a in list(QuestionResponse.objects.filter(lesson=lesson,user=user))]
        out_dict['responseData']['PollQuestion'] = [a.to_dict() for a in list(PollQuestionResponse.objects.filter(lesson=lesson,user=user))]
        out_dict['responseData']['Writing'] = [a.to_dict() for a in list(WritingResponse.objects.filter(lesson=lesson,user=user))]
        
        out_dict['highestActivity'] = 0
        for value in out_dict['responseData'].values():
            out_dict['highestActivity'] += len(value)
            
        return {
            "response": out_dict
        }
        
class QuizResponseService:
    @staticmethod
    def __get_feedback_for_score(quiz, score):
        """
        (Private method)
        Get the appropriate feedback based on the quiz score
        
        Args:
            quiz: The Quiz object
            score: The user's score
            
        Returns:
            str: The feedback message
        """
        if not quiz.feedback_config or 'ranges' not in quiz.feedback_config:
            return quiz.feedback_config.get('default', '')
            
        ranges = quiz.feedback_config.get('ranges', [])
        default_feedback = quiz.feedback_config.get('default', '')
        
        for range_config in ranges:
            min_score = range_config.get('min', 0)
            max_score = range_config.get('max', 0)
            
            if min_score <= score <= max_score:
                return range_config.get('feedback', default_feedback)
        
        return default_feedback

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

        # Get the quiz object
        quiz = Quiz.objects.get(id=quiz_id)

        # Get or create a quiz response object
        quiz_response, created = UserQuizResponse.objects.get_or_create(
            user=user,
            quiz_id=quiz_id,
            defaults={'is_complete': False}
        )

        # If quiz is being completed, update completion status and time
        if is_complete and not quiz_response.is_complete:
            quiz_response.is_complete = True
            quiz_response.updated_at = timezone.now()

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
            feedback = QuizResponseService.__get_feedback_for_score(quiz, quiz_response.score)
            quiz_response.completion_percentage = 100.0 # Set 100% complete
        else:
            feedback = ''
            
            # Calculate completion percentage based on answered questions
            total_quiz_questions = Question.objects.filter(quiz_id=quiz_id).count()
            answered_questions = quiz_response.question_responses.count()

            if total_quiz_questions > 0:
                quiz_response.completion_percentage = (answered_questions / total_quiz_questions) * 100
            else:
                quiz_response.completion_percentage = 0.0

        # Save the quiz response with updated completion percentage
        quiz_response.save()
        
        # Return both the quiz response and feedback
        # Feedback is separate from the model because it will likely only be displayed once upon submission
        return {
            'quiz_response': quiz_response,
            'feedback': feedback
        }
    
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
        
class PollResponseService:
    @staticmethod
    @transaction.atomic
    def submit_poll_response(user: User, data: dict):
        """
        Process a user's poll submission

        Args:
            user: The user submitting the poll
            data: Dictionary containing poll submission data (validated by serializer)

        Returns:
            dict: Dictionary containing processed poll response data
        """
        poll_id = data.get('poll_id')
        lesson_id = data.get('lesson_id')
        is_complete = data.get('is_complete', True)
        question_responses_data = data.get('question_responses', [])

        # Get the poll and lesson objects
        poll = Poll.objects.get(id=poll_id)
        lesson = Lesson.objects.get(id=lesson_id)
        
        responses = []

        # Process each question response
        for response_data in question_responses_data:
            poll_question_id = response_data.get('poll_question_id')
            response_content = response_data.get('response_data')

            # Create or update the poll question response
            poll_response, _ = PollQuestionResponse.objects.update_or_create(
                user=user,
                poll_id=poll_id,
                lesson=lesson,
                defaults={
                    'response_data': response_content,
                    'partial_response': not is_complete
                }
            )
            
            responses.append(poll_response)

        return {
            'poll_responses': [response.to_dict() for response in responses]
        }
    
    @staticmethod
    def get_user_poll_responses(user, poll_id=None):
        """
        Get a user's responses to polls.

        Args:
            user: The user whose responses to retrieve
            poll_id: Optional poll ID to filter by

        Returns:
            QuerySet: User's poll responses
        """
        if poll_id:
            return PollQuestionResponse.objects.filter(user=user, poll_id=poll_id)
        return PollQuestionResponse.objects.filter(user=user)
    
    @staticmethod
    def get_poll_response_details(user, poll_id, lesson_id):
        """
        Get detailed information about poll responses for a specific poll and lesson.
        
        Args:
            user: The user who submitted the responses
            poll_id: ID of the poll
            lesson_id: ID of the lesson
            
        Returns:
            QuerySet: The poll question responses
        """
        return PollQuestionResponse.objects.filter(
            user=user,
            poll_id=poll_id,
            lesson_id=lesson_id
        )