# Business logic
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import ActivityManager, User, Lesson, Quiz, Question, UserQuizResponse, UserQuestionResponse, Embed, EmbedResponse
from rest_framework import request


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
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
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
        # TODO: idk about the default value here
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
            feedback = QuizResponseService.__get_feedback_for_score(
                quiz, quiz_response.score)
            quiz_response.completion_percentage = 100.0  # Set 100% complete
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


class EmbedResponseService:
    @staticmethod
    def update_embed_completion_status(validated_data: dict, request: request):
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

        response_object.partial_response = validated_data.get('associated_activity').code is not None and (request.data.get('inputted_code', None) != validated_data.get('associated_activity').code)
        response_object.time_spent = validated_data.get("time_spent", 0)
        response_object.attempts_left = validated_data.get("attempts_left", 0)
        response_object.inputted_code = request.data.get('inputted_code', "")
        
        
        response_object.save()
        return response_object


ActivityManager.registerService(
    ActivityManager, "response", Quiz, QuizResponseService.submit_quiz_response)
ActivityManager.registerService(
    ActivityManager, "response", Embed, EmbedResponseService.update_embed_completion_status)
