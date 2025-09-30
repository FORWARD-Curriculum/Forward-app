# Business logic
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import ActivityManager, User, Lesson, Quiz, Question, UserQuizResponse, UserQuestionResponse, Embed, EmbedResponse, Facility
from rest_framework.request import Request as DRFRequest


class UserService:
    @staticmethod
    @transaction.atomic
    def create_user(data: dict):
        """
        Create a new user with validated data


        Args:
            data (dict): Dictionary containing user data including:
                        username, password, email, display_name, facility, consent


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
            if 'facility' in data:
                user.facility = data['facility']

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
                'user': user.to_dict()
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
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            raise
            raise
        lesson_dict = lesson.to_dict()

        activity_list = []


        for value in ActivityManager.registered_activities.values():
            ActivityModel, child_class = value[0], value[3]
            if not child_class:
                activities = list(ActivityModel.objects.filter(
                    lesson=lesson).order_by('order'))
                for activity in activities:
                    activity_list.append(activity.to_dict())

        lesson_dict["activities"] = sorted(
            activity_list, key=lambda x: x["order"])

        return {
            "lesson": lesson_dict
        }


class ResponseService:
    staticmethod

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

        out_dict = {}
        out_dict['lesson_id'] = lesson.id
        out_dict['response_data'] = {}
        for value in ActivityManager.registered_activities.values():
            [Activity, Response] = value[:2]
            if (Response is not None):
                out_dict['response_data'][Activity.__name__] = [a.to_dict() for a in list(Response.objects.filter(lesson=lesson,user=user))]
        
        out_dict['highest_activity'] = 1
        for value in out_dict['response_data'].values():
            out_dict['highest_activity'] += len(value)


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
    def submit_quiz_response(validated_data, request):
        """
        Process a user's quiz submission from the unified API
        
        Args:
            validated_data: The validated data from the serializer
            request: The request object containing the user
            
        Returns:
            An object with to_dict method containing the response data
        """
        try:
            user = request.user
            
            # Extract the quiz ID from the associated_activity
            quiz_obj = validated_data.get('associated_activity')
            if hasattr(quiz_obj, 'id'):
                quiz_id = quiz_obj.id
            else:
                quiz_id = quiz_obj
                
            lesson_id = validated_data.get('lesson_id')
            partial_response = validated_data.get('partial_response', True)
            
            # Get the quiz object
            quiz = Quiz.objects.get(id=quiz_id)
            
            # If we have a lesson ID, get the lesson object
            if lesson_id:
                if isinstance(lesson_id, Lesson):
                    lesson = lesson_id
                else:
                    try:
                        lesson = Lesson.objects.get(id=lesson_id)
                    except Lesson.DoesNotExist:
                        # Try to get lesson from quiz
                        lesson = quiz.lesson
            else:
                # Try to get lesson from quiz
                lesson = quiz.lesson
                
            # Create or get quiz response
            quiz_response, created = UserQuizResponse.objects.get_or_create(
                user=user,
                associated_activity=quiz,
                defaults={
                    'lesson': lesson,
                    'partial_response': partial_response
                }
            )
            
            # Update if not newly created
            if not created:
                quiz_response.partial_response = partial_response
                quiz_response.save()
                
            # Calculate score and feedback
            if not partial_response:
                quiz_response.calculate_score()
                feedback = QuizResponseService.__get_feedback_for_score(
                    quiz, quiz_response.score)
                quiz_response.completion_percentage = 100.0
            else:
                feedback = ''
                # Calculate completion percentage based on answered questions
                total_quiz_questions = Question.objects.filter(
                    quiz_id=quiz_id).count()
                answered_questions = quiz_response.question_responses.count()

                if total_quiz_questions > 0:
                    quiz_response.completion_percentage = (
                        answered_questions / total_quiz_questions) * 100
                else:
                    quiz_response.completion_percentage = 0.0
                
            quiz_response.save()
            
            # Return the response with feedback
            class QuizResponseWrapper:
                def __init__(self, quiz_response, feedback):
                    self.quiz_response = quiz_response
                    self.feedback = feedback
                    
                def to_dict(self):
                    response_dict = self.quiz_response.to_dict()
                    response_dict['feedback'] = self.feedback
                    return response_dict
            
            return QuizResponseWrapper(quiz_response, feedback)
            
        except Exception as e:
            print(f"Error in submit_quiz_response: {e}")
            raise


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

class QuestionResponseService:
    @staticmethod
    @transaction.atomic
    def submit_question_response(validated_data, request):
        """
        Process a user's response to an individual question.
        
        Args:
            validated_data: The validated data from the serializer
            request: The request object containing the user
            
        Returns:
            UserQuestionResponse: The created/updated question response
        """
        try:
            user = request.user
            
            # Extract the question object from validated_data
            question = validated_data.get('associated_activity')
            quiz_id = validated_data.get('quiz_id')
            lesson_id = validated_data.get('lesson_id')
            response_data = validated_data.get('response_data', {})
            time_spent = validated_data.get('time_spent', 0)
            
            # Get the quiz first
            quiz = Quiz.objects.get(id=quiz_id)
            
            # Handle lesson_id properly
            if lesson_id:
                if isinstance(lesson_id, Lesson):
                    lesson = lesson_id
                else:
                    try:
                        lesson = Lesson.objects.get(id=lesson_id)
                    except Lesson.DoesNotExist:
                        lesson = quiz.lesson
            else:
                lesson = quiz.lesson
                    
            # Get or create the parent quiz response
            quiz_response, created = UserQuizResponse.objects.get_or_create(
                user=user,
                associated_activity_id=quiz,
                defaults={
                    'lesson': lesson,  # ← Changed
                    'partial_response': True,
                    'completion_percentage': 0.0
                }
            )
            
            # Get or create the question response
            question_response, created = UserQuestionResponse.objects.update_or_create(
                user=user,
                quiz_response=quiz_response,
                question=question,
                defaults={
                    'lesson': lesson,  # ← Changed
                    'response_data': response_data,
                    'time_spent': time_spent
                }
            )
            
            # Evaluate the correctness of the response
            question_response.evaluate_correctness()
            
            # Update quiz completion percentage
            total_quiz_questions = Question.objects.filter(quiz_id=quiz_id).count()
            answered_questions = quiz_response.question_responses.count()
            
            if total_quiz_questions > 0:
                quiz_response.completion_percentage = (answered_questions / total_quiz_questions) * 100
            else:
                quiz_response.completion_percentage = 0.0
                
            quiz_response.save()
            
            return question_response
            
        except Exception as e:
            print(f"Error in submit_question_response: {e}")
            import traceback
            traceback.print_exc()
            raise


class EmbedResponseService:
    @staticmethod
    def update_embed_completion_status(validated_data: dict, request: DRFRequest):
        """
        Update the completion status of an embed response.

        Args:
            validated_data: Dictionary containing validated data
            request: The HTTP request object
        Returns:
            EmbedResponse: The created/updated embed response object"""
            
        response_object, _ = EmbedResponse.objects.get_or_create(
            user=request.user,
            associated_activity=validated_data.get(
                'associated_activity'),
            lesson=validated_data.get("lesson_id"),
            id=validated_data.get('id', None),
        )

        # Fix: Access request data safely
        inputted_code = None
        if hasattr(request, 'data'):
            inputted_code = request.data.get('inputted_code', None)
        
        response_object.partial_response = validated_data.get('associated_activity').code is not None and (inputted_code != validated_data.get('associated_activity').code)
        response_object.time_spent = validated_data.get("time_spent", 0)
        response_object.attempts_left = validated_data.get("attempts_left", 0)
        
        # Fix: Access request data safely
        if hasattr(request, 'data'):
            response_object.inputted_code = request.data.get('inputted_code', "")
        
        
        response_object.save()
        return response_object

ActivityManager().registerService("response", Quiz, QuizResponseService.submit_quiz_response)
ActivityManager().registerService("response", Question, QuestionResponseService.submit_question_response)

ActivityManager().registerService("response", Embed, EmbedResponseService.update_embed_completion_status)
