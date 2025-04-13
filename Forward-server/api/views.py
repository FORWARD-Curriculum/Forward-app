from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework import status
<<<<<<< HEAD
from .serializers import UserLoginSerializer, UserRegistrationSerializer, UserUpdateSerializer, QuizSubmissionSerializer, UserQuizResponseDetailSerializer, UserPollQuestionResponseSerializer, PollSubmissionSerializer
from core.services import UserService, LessonService, QuizResponseService, PollResponseService
=======
from .serializers import UserLoginSerializer, UserRegistrationSerializer, UserUpdateSerializer, QuizSubmissionSerializer, UserQuizResponseDetailSerializer, ResponseSerializer
from core.services import UserService, LessonService, QuizResponseService, ResponseService
>>>>>>> 5bbcbcf3c672f65b5d7f6183d19e50c3377448d0
from .utils import json_go_brrr, messages
from core.models import ActivityManager, Quiz, Lesson, TextContent, Poll, PollQuestion, UserQuizResponse, Writing, Question
from rest_framework import serializers


class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    Endpoint: POST /api/users/
    """
    serializer_class = UserRegistrationSerializer  # Handles data validation and user creation
    # Allows anyone to register (no authentication required)
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Handle the user registration process. It:
        1. Validates the incoming registration data
        2. Creates the user if validation passes
        3. Returns the newly created user's details
        4. Logs in the new user

        Raises:
            ValidationError: If the registration data is invalid
        """
        serializer: UserRegistrationSerializer = self.get_serializer(
            data=request.data)
        # Validates the data, raises exception if invalid
        serializer.is_valid(raise_exception=True)
        user = serializer.save()  # Creates the user
        # Logs the user in and returns user data
        user_data = UserService.login_user(request, user)

        return json_go_brrr(
            message="Registration successful",
            data=user_data,
            status=status.HTTP_201_CREATED
        )


class SessionView(APIView):
    """
    API endpoint for managing user sessions.

    POST: Create a new session (login)
    DELETE: Terminate the session (logout)
    """

    def get_permissions(self):
        """
        Only POST requests do not require authentication.
        """
        if self.request.method == 'POST':
            return [AllowAny()]
        return [IsAuthenticated()]

    def post(self, request, *args, **kwargs):
        """
        Handle user login and create a new session.
        Accessible to unauthenticated users.
        """
        serializer = UserLoginSerializer(
            data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        user_data = UserService.login_user(request, user)

        return json_go_brrr(
            message="Login successful",
            data=user_data,
            status=status.HTTP_200_OK
        )

    def delete(self, request, *args, **kwargs):
        """End the current session (logout)"""
        UserService.logout_user(request)

        return json_go_brrr(
            message="Logout successful",
            status=status.HTTP_200_OK
        )


class CurrentUserView(APIView):
    """
    Endpoint for retrieving/updating current user information

    GET: Get the current user session
    PATCH: Update the current user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Return the current user's information.
        Only accessible to authenticated users.
        """
        user = request.user
        return json_go_brrr(
            data={
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
            },
            status=status.HTTP_200_OK
        )

    def patch(self, request, *args, **kwargs):
        """
        Update the current user's information.
        Only accessible to authenticated users.
        """
        user = request.user
        serializer = UserUpdateSerializer(
            user, data=request.data, partial=True)
        if serializer.is_valid():
            updated_user = serializer.save()  # Saves the changes to the user model
            return json_go_brrr(
                message="User information updated successfully",
                data={
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
                },
                status=status.HTTP_200_OK
            )

        return json_go_brrr(
            message="Failed to update user information",
            data=serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class QuizView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        '''
        gets a quiz by its lesson id
        '''
        [id] = kwargs.values()
        quiz = Quiz.objects.get(lesson_id=id)

        if not quiz:
            return Response({"detail": "cannot find quiz with this id"}, status=status.HTTP_404_NOT_FOUND)

        questions = Question.objects.filter(quiz_id=quiz.id)

        return Response({
            "detail": messages['successful_id'],
            "data": {
                "quiz": quiz.to_dict(),
                "questions": [q.to_dict() for q in questions]}},
            status=status.HTTP_200_OK
        )

    def post(self, req, *args, **kwargs):
        '''
        submits a quiz by creating a new userdata row in db
        '''

        # need to make user data table to save to. TBD


class GetLessonIds(APIView):
    permission_classess = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        lessons = Lesson.objects.all()
        return Response([le.to_dict() for le in lessons])


class CurriculumView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        '''
        gets all lessons
        '''
        lessons = Lesson.objects.all()

        if not lessons:
            return Response({"detail": "cannot find any lessons"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "detail": messages['successful_id'],
            "data": [l.to_dict() for l in lessons]},
            status=status.HTTP_200_OK)


class LessonView(APIView):
    permission_classes = [IsAuthenticated]

    def index(self, request, *args, **kwargs):
        '''
        get all lessons meta data
        '''
        lessons = Lesson.objects.all()

        if not lessons:
            return Response({"detail": "there seems to be an error querying the data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "detail": "successful query of all lessons",
            "data": [one_l.to_dict() for one_l in lessons]},
            status=status.HTTP_200_OK)

    def get(self, request, *args, **kwargs):
        '''
        gets lesson by id
        '''
        [id] = kwargs.values()
        lesson = Lesson.objects.get(id=id)

        if not lesson:
            return Response({"detail": "cannot find a lesson with this id"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "detail": messages['successful_id'],
            "data": lesson.to_dict()},
            status=status.HTTP_200_OK)


class LessonContentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        lesson_id = kwargs.get('id')
        lesson = LessonService.get_lesson_content(lesson_id=lesson_id)
        response = ResponseService.get_response_data(
            lesson_id=lesson_id, user=request.user)

        return json_go_brrr(
            message="Successfully retrieved lesson content",
            data={**lesson, **response},
            status=status.HTTP_200_OK
        )

    def post(self, request, *args, **kwargs):
        data_type = self.request.body.data_type
        time = self.request.body.time
        score = self.request.body.score
        responses = self.request.body.responses
        # commented out because well change the response data
        # new_data = ResponseData(data_type=data_type,time=time,score=score,responses=responses)
        # new_data.save()
        return Response({"detail": 'successfully saved data'}, status=status.HTTP_200_OK)


class TextContentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        '''
        gets text content by lesson id
        '''
        [id] = kwargs.values()
        text_content = TextContent.objects.filter(lesson_id=id)

        if not text_content:
            return Response({"detail": "cannot find text content with this lesson id"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "detail": messages['successful_id'],
            "data": [t.to_dict() for t in text_content]},
            status=status.HTTP_200_OK)


class WritingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        [id] = kwargs.values()
        writing = Writing.objects.filter(lesson_id=id)

        if not writing:
            return Response({"detail": "cannot find writing activity with this lesson id"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "detail": messages['successful_id'],
            "data": [w.to_dict() for w in writing]},
            status=status.HTTP_200_OK)


class PollView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        '''
        this structure wont work for multiple polls unless we add a limit to these
        '''
        [id] = kwargs.values()
        poll = Poll.objects.get(lesson_id=id)

        if not poll:
            return Response({"detail": "cannot find poll with this lesson id"}, status=status.HTTP_404_NOT_FOUND)

        poll_qs = PollQuestion.objects.filter(poll_id=poll.id)

        return Response({
            "detail": messages['successful_id'],
            "data": {
                "poll": poll.to_dict(),
                "pollQuestions": [q.to_dict() for q in poll_qs]}},
            status=status.HTTP_200_OK)


class ResponseView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        activity_type: str = kwargs.get("activitytype").lower()
        if not activity_type:
            return Response({"detail": "Activity type missing in URL path."}, status=status.HTTP_400_BAD_REQUEST)

        activity_config = ActivityManager.registered_activities.get(activity_type.lower())
        if not activity_config:
            return Response({"detail": f"Invalid activity type: {activity_type}"}, status=status.HTTP_400_BAD_REQUEST)

        print(request.data.get("lesson_id"))

        serializer = ResponseSerializer(
            data=request.data,
            context={
                'request': request,
                'activity_config': activity_config
            }
        )

        try:
            serializer.is_valid(raise_exception=True)
            response_object = serializer.save()
            return Response(
                {"detail": "Successfully saved " + activity_type,
                    "data": response_object.to_dict()},
                status=status.HTTP_201_CREATED
            )
        except serializers.ValidationError as e:
            # Handles validation errors from serializer or explicit raises
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Internal Server Error: {e}")
            return Response({"detail": "An internal error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QuizResponseView(APIView):
    """
    API endpoint for submitting and retrieving quiz responses.

    POST: Submit a quiz response
    GET: Retrieve a user's quiz responses
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Submit a quiz response"""
        serializer = QuizSubmissionSerializer(data=request.data)
        if (serializer.is_valid()):
            result = QuizResponseService.submit_quiz_response(
                user=request.user,
                data=serializer.validated_data
            )

            quiz_response = result['quiz_response']
            feedback = result['feedback']

            return json_go_brrr(
                message="Quiz response submitted successfully",
                data={
                    "quiz_response": quiz_response.to_dict(),
                    "feedback": feedback
                },
                status=status.HTTP_201_CREATED
            )

        return json_go_brrr(
            message="Failed to submit quiz response",
            data=serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def get(self, request, *args, **kwargs):
        """Retrieve a user's quiz responses, optionally filtered by quiz_id"""
        quiz_id = request.query_params.get('quiz_id')
        responses = QuizResponseService.get_user_quiz_responses(
            request.user, quiz_id)

        return json_go_brrr(
            message="Quiz responses retrieved successfully",
            data={'quiz_responses': [response.to_dict()
                                     for response in responses]},
            status=status.HTTP_200_OK
        )

<<<<<<< HEAD
class PollResponseView(APIView):
    """
    API endpoint for submitting and retrieving poll responses.

    POST: Submit a poll response
    GET: Retrieve a user's poll responses
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Submit a poll response"""
        # Assume PollSubmissionSerializer validates poll_id and responses structure
        serializer = PollSubmissionSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Assume PollResponseService handles saving the response
                # It might return just the saved response object, as polls
                # don't typically have right/wrong answer feedback like quizzes.
                poll_response = PollResponseService.submit_poll_response(
                    user=request.user,
                    data=serializer.validated_data
                )

                # Check if the service call was successful (it might return None on error)
                if poll_response:
                    return json_go_brrr(
                        message="Poll response submitted successfully",
                        data={
                            # Assumes UserPollResponse model has a .to_dict() method
                            "poll_response": poll_response.to_dict(),
                        },
                        status=status.HTTP_201_CREATED
                    )
                else:
                    # Handle cases where the service indicates failure without raising an exception
                    return json_go_brrr(
                        message="Failed to submit poll response due to server logic.",
                        data={},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            except Exception as e:
                 # Catch potential exceptions from the service layer
                 return json_go_brrr(
                        message=f"An error occurred: {str(e)}",
                        data={},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                 )

        # If serializer is invalid
        return json_go_brrr(
            message="Failed to submit poll response due to invalid data",
            data=serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def get(self, request, *args, **kwargs):
        """Retrieve a user's poll responses, optionally filtered by poll_id"""
        # Get optional poll_id from query parameters
        poll_id = request.query_params.get('poll_id')

        try:
            # Assume PollResponseService retrieves the responses
            responses = PollResponseService.get_user_poll_responses(request.user, poll_id)

            return json_go_brrr(
                message="Poll responses retrieved successfully",
                # Assumes UserPollResponse model has a .to_dict() method
                data={'poll_responses': [response.to_dict() for response in responses]},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            # Catch potential exceptions during retrieval
            return json_go_brrr(
                message=f"An error occurred while retrieving poll responses: {str(e)}",
                data={},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    # def post(self, request, *args, **kwargs):
        """Submit a quiz response"""
        # serializer = QuizSubmissionSerializer(data=request.data)
        # if (serializer.is_valid()):
        #     result = QuizResponseService.submit_quiz_response(
        #         user=request.user,
        #         data=serializer.validated_data
        #     )

        #     quiz_response = result['quiz_response']
        #     feedback = result['feedback']

        #     return json_go_brrr(
        #         message="Quiz response submitted successfully",
        #         data={
        #             "quiz_response": quiz_response.to_dict(),
        #             "feedback": feedback
        #         },
        #         status=status.HTTP_201_CREATED
        #     )
=======
>>>>>>> 5bbcbcf3c672f65b5d7f6183d19e50c3377448d0

class QuizResponseDetailView(APIView):
    """
    API endpoint for retrieving a specific quiz response

    GET: Retrieve details of a specific quiz response
    """

    def get(self, request, response_id, *args, **kwargs):
        try:
            response = QuizResponseService.get_quiz_response_details(
                request.user, response_id)

            return json_go_brrr(
                message="Quiz response details retrieved successfully",
                data={'quiz_response': response.to_dict()},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return json_go_brrr(
                message=str(e),
                status=status.HTTP_404_NOT_FOUND
            )


class QuizResponseStatusView(APIView):
    """
    API endpoint for tracking quiz status within a lesson.
    Includes:
        - Completion status flag
        - Completion percentage
        - Score

    GET: Get the quiz status for a specific lesson for the current user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        quiz_id = kwargs.get('id')
        user = request.user

        try:
            # Check if the quiz exists
            _ = Quiz.objects.get(id=quiz_id)

            # Get the user's response for this quiz if it exists
            try:
                quiz_response = UserQuizResponse.objects.get(
                    user=user,
                    quiz_id=quiz_id
                )

                return json_go_brrr(
                    message="Retrieved quiz completion status",
                    data={
                        'quiz_id': quiz_id,
                        'is_complete': quiz_response.is_complete,
                        'completion_percentage': quiz_response.completion_percentage,
                        'score': quiz_response.score,
                    },
                    status=status.HTTP_200_OK
                )
            except UserQuizResponse.DoesNotExist:
                # User hasn't started this quiz yet
                return json_go_brrr(
                    message="No response found for this quiz",
                    data={
                        'quiz_id': quiz_id,
                        'is_complete': False,
                        'completion_percentage': 0.0,
                        'score': None,
                    },
                    status=status.HTTP_200_OK
                )

        except Quiz.DoesNotExist:
            return json_go_brrr(
                message="Quiz not found",
                status=status.HTTP_404_NOT_FOUND
            )
