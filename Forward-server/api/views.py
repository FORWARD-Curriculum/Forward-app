from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserLoginSerializer, UserRegistrationSerializer, UserUpdateSerializer, ResponseSerializer
# QuizSubmissionSerializer, UserQuizResponseDetailSerializer,
from core.services import UserService, LessonService, QuizResponseService, ResponseService
# , QuestionResponseService
from .utils import json_go_brrr, messages
from core.models import ActivityManager, Quiz, Lesson, TextContent, UserQuizResponse, Writing, Question, User, BugReport
from rest_framework import serializers, request
import logging
from django.contrib.auth.decorators import login_required
from core.utils import s3_file_upload, s3_file_delete
from django.http import JsonResponse, HttpResponse
import uuid


logger = logging.getLogger(__name__)


from core.utils import FwdImage
from core.models import JSONImageModel

GENERIC_FORWARD_IMAGE = FwdImage()


@login_required
def file_handler_view(request):
    if request.method == "POST":
        file = request.FILES.get("file")
        if not file:
            return JsonResponse({"error": "file missing"}, status=400)
        
        model = JSONImageModel.objects.create(
            image=file
        )
        
        model.save()
        
        # model_name = request.POST.get("model_name", "")

        # s3_key = f"public/{model_name.lower()}{uuid.uuid4()}_{file.name}"
        # url = s3_file_upload(file=file, s3_path=s3_key)
        
        return JsonResponse({"value": model.id})

    elif request.method == "GET":
        return JsonResponse({"results": []})

    elif request.method == "DELETE":
        trigger = request.GET.get("trigger")
        file_names = request.GET.getlist("value")

        if trigger != "delete_button":
            return HttpResponse(status=200)

        for name in file_names:
            s3_file_delete(name)

        return HttpResponse(status=200)

      
class BugReportView(APIView):
    """
    API endpoint for submitting bug reports.

    POST: Submit a bug report
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        """Submit a bug report"""
        # Extract bug report details from the request data
        description = request.data.get('description')
        steps_to_reproduce = request.data.get('steps_to_reproduce')
        recent_window_locations = request.data.get('recent_window_locations')
        app_state = request.data.get('app_state')
        device_info = request.data.get('device_info')
        app_version = request.data.get('app_version')
        
        if not description:
            return json_go_brrr(
                message="Description is required for a bug report",
                status=status.HTTP_400_BAD_REQUEST
            )

        br = BugReport.objects.create(
            user=request.user if request.user.is_authenticated else None,
            description=description,
            steps_to_reproduce=steps_to_reproduce,
            recent_window_locations=recent_window_locations,
            app_state=app_state,
            device_info=device_info,
            app_version=app_version
        )
        
        if not br:
            return json_go_brrr(
                message="Failed to submit bug report",
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )     

        return json_go_brrr(
            message="Bug report submitted successfully",
            data={
                "id": br.id,
            },
            status=status.HTTP_201_CREATED
        )

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
        user: User = request.user
        return json_go_brrr(
            data={
                'user': user.to_dict()
            },
            status=status.HTTP_200_OK
        )

    def patch(self, request, *args, **kwargs):
        """
        Update the current user's information.
        Only accessible to authenticated users.
        """
        user: User = request.user
        serializer = UserUpdateSerializer(
            user, data=request.data, partial=True)
        if serializer.is_valid():
            updated_user = serializer.save()  # Saves the changes to the user model
            return json_go_brrr(
                message="User information updated successfully",
                data={
                    'user': user.to_dict()
                },
                status=status.HTTP_200_OK
            )

        return json_go_brrr(
            message="Failed to update user information",
            data=serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    

class ResetStudentProgressView(APIView):

    permission_classes=[IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        """Delete all lesson response data for teh current user"""

        user = request.user

        #failsafe on teh chance of frontend manipulation
        if user.username not in ['student1', 'student2']:
            return Response(
                {"error": "Unauthorized: only test acounts can reset progress"},
                status=status.HTTP_403_FORBIDDEN
            )

        manager = ActivityManager()
        for activity_name, (ActivityClass, ResponseClass, _, __, ___) in manager.registered_activities.items(): # syntax for unpacking tuple / activity manager
            if ResponseClass:  # some activities have no response (like Concept)
                ResponseClass.objects.filter(user=user).delete()


        return json_go_brrr(
            message="All lesson progress reset successfully",
            status=status.HTTP_200_OK
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


class GetLessonIds(APIView):
    permission_classess = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        lessons = Lesson.objects.all()
        return Response([le.to_dict() for le in lessons])


class CurriculumView(APIView):
    # permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny] # need to double check this

    def get(self, request, *args, **kwargs):
        '''
        gets all lessons
        '''
        lessons = Lesson.objects.filter(active=True)

        if not lessons:
            return Response({"detail": "cannot find any lessons"}, status=status.HTTP_404_NOT_FOUND)

        lesson_data = []
        for i in lessons:
            data = i.to_dict()
            
            # In case an individual accessing the lesson is a guest
            if request.user.is_authenticated:
                data["completion"] = LessonService.get_lesson_completion(request.user, i)
            else:
                data["completion"] = 0 
            lesson_data.append(data)
        return Response({
            "detail": messages['successful_id'],
            # "data": [{**l.to_dict(), "completion": LessonService.get_lesson_completion(request.user, l)} for l in lessons]},
            "data": lesson_data},
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
    # Any Allowed for guest user access
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        lesson_id = kwargs.get('id')
        lesson = LessonService.get_lesson_content(lesson_id=lesson_id)

        if (request.user.is_authenticated):
            response = ResponseService.get_response_data(
                lesson_id=lesson_id, user=request.user)
        else:
            response = {} # empty for now

        return json_go_brrr(
            message="Successfully retrieved lesson content",
            data={**lesson, **response},
            status=status.HTTP_200_OK
        )

    def post(self, request, *args, **kwargs):

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Guest users cannot save responses"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
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

class ResponseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        activity_type: str = kwargs.get("activitytype").lower()
        if not activity_type:
            return Response({"detail": "Activity type missing in URL path."}, status=status.HTTP_400_BAD_REQUEST)

        activity_config = ActivityManager.registered_activities.get(activity_type.lower())
        if not activity_config:
            return Response({"detail": f"Invalid activity type: {activity_type}"}, status=status.HTTP_400_BAD_REQUEST)

        # Prepare context for serializer
        context = {
            'request': request,
            'activity_config': activity_config
        }

        serializer = ResponseSerializer(
            data=request.data,
            context=context
        )

        try:
            serializer.is_valid(raise_exception=True)
            response_object = serializer.save()
            
            # Handle different response object types
            try:
                response_data = response_object.to_dict()
            except (AttributeError, TypeError) as e:
                print(f"Error calling to_dict(): {e}")
                # Fallback for objects without to_dict
                if hasattr(response_object, '__dict__'):
                    response_data = response_object.__dict__
                else:
                    response_data = {"id": getattr(response_object, "id", None)}
            
            return Response(
                {"detail": "Successfully saved " + activity_type,
                    "data": response_data},
                status=status.HTTP_200_OK
            )
        except serializers.ValidationError as e:
            # Handles validation errors from serializer or explicit raises
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Internal Server Error: {e}")
            return Response({"detail": "An internal error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
                        'is_complete': quiz_response.partial_response,
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
           
class OnboardView(APIView):
    def get(self, request):
        user: User = request.user
        if user:
            if(user.consent):
                return json_go_brrr(
                    message="Nessecary surveying info:",
                    data={
                        "survey": "https://asu.co1.qualtrics.com/jfe/form/SV_9BtOetx46YdBQW2"
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return json_go_brrr(
                    message="You have not agreed to participate in the FORWARD research program.",
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            return json_go_brrr(
                message="Must be logged in to take the survey.",
                status=status.HTTP_404_NOT_FOUND
            )