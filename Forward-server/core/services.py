# Business logic
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import ActivityManager, User, Lesson, Quiz, Question, UserQuizResponse, UserQuestionResponse, Embed, EmbedResponse, Facility, BaseResponse
from rest_framework.request import Request as DRFRequest
from django.core.exceptions import ValidationError as DjangoValidationError

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
        except DjangoValidationError as e:
            # Preserve field-level errors from model full_clean()
            if hasattr(e, "message_dict"):
                raise DjangoValidationError(e.message_dict)
            raise DjangoValidationError(e.messages)
        except KeyError as e:
            raise DjangoValidationError(f'Missing required field: {str(e)}')


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
    def get_lesson_completion(user: User, lesson: Lesson):
        responses = 0                       
        for value in ActivityManager.registered_activities.values():
            [_, Response, _, child_class] = value[:4]
            if not child_class:
                responses += Response.objects.filter(lesson=lesson,user=user).count()
        return (responses/lesson.total_activities) if lesson.total_activities != 0 else 0
    
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
        for activity_type in out_dict['response_data'].values():
            response: dict
            for response in activity_type:
                out_dict['highest_activity'] += 1 if response.get('partial_response', False) == False else 0


        return {
            "response": out_dict
        }


class QuizResponseService:
    @staticmethod
    @transaction.atomic
    def submit_quiz_response(validated_data, request):
        """
        Process a user's quiz submission from the unified API
        
        Args:
            validated_data: The validated data from the serializer containing:
                - associated_activity: Quiz object
                - submission: List of question responses
                - partial_response: Boolean
                - time_spent: Integer
                - attempts_left: Integer
                
        Returns:
            UserQuizResponse object with to_dict method
        """
        try:
            user = request.user
            quiz = validated_data.get('associated_activity')
            lesson = quiz.lesson
            partial_response = validated_data.get('partial_response', True)
            submission = validated_data.get('submission', [])  # NEW: Get submission data
            time_spent = validated_data.get('time_spent', 0)
            attempts_left = validated_data.get('attempts_left', 3)
            
            # create or get quiz response
            quiz_response, created = UserQuizResponse.objects.update_or_create(
                user=user,
                associated_activity=quiz,
                defaults={
                    'lesson': lesson,
                    'partial_response': partial_response,
                    'time_spent': time_spent,
                    'attempts_left': attempts_left
                }
            )
            
            # Process each question in the submission
            for question_data in submission:
                question_id = question_data.get('associated_activity')
                response_data = question_data.get('response_data', {})
                
                if question_id:
                    question = Question.objects.get(id=question_id)

                    # Create or update the question response
                    question_response, qr_created = UserQuestionResponse.objects.get_or_create(
                        user=user,
                        quiz_response=quiz_response,
                        question=question,
                        defaults={
                            'lesson': lesson,
                            'response_data': response_data,
                            'time_spent': 0,  # Could extract from question_data if needed
                            "attempts_left": 2 # weird workaround, there are actually 3 attempts, but the first attemp also creates the question, id is null during teh first request but it is evaluated. This will make it decrement correctly 3 times
                        }
                    )

                    if not qr_created:
                        question_response.response_data = response_data

                    question_response.evaluate_correctness()

                    if question_response.is_correct:
                        question_response.attempts_left = 0
                      
                    elif not qr_created:
                        # then we decrement
                        question_response.attempts_left = max(0, question_response.attempts_left - 1)

                    question_response.save()

                    # Questions are considered responded after one answer is submitted
                    total_questions = Question.objects.filter(quiz=quiz, is_required = True).count()
                    attempted_questions = quiz_response.question_responses.count()

                    if attempted_questions >= total_questions:
                        quiz_response.partial_response = False

                    if not quiz_response.partial_response:
                        quiz_response.calculate_score()
                        


                    question_response.save()

            # check if all questions have been attempted
            all_questions_attempted = all(
                qr.partial_response == False
                for qr in quiz_response.question_responses.all()
            )

            if all_questions_attempted:
                quiz_response.partial_response = False        
            
            # calculate completion percentage
            total_questions = Question.objects.filter(quiz=quiz).count()
            answered_questions = quiz_response.question_responses.count()
            
            if total_questions > 0:
                quiz_response.completion_percentage = (answered_questions / total_questions) * 100
            
            # calculate score if not partial
            if not quiz_response.partial_response:
                quiz_response.calculate_score()
                feedback = ""
                quiz_response.completion_percentage = 100.0
            else:
                feedback = ''
            
            quiz_response.save()
            
            # return wrapper with feedback
            # TODO remove dependencies and connections to this wrapper
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
            import traceback
            traceback.print_exc()
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

ActivityManager().registerService("response", Quiz, QuizResponseService.submit_quiz_response) # temp for now
ActivityManager().registerService("response", Embed, EmbedResponseService.update_embed_completion_status)
