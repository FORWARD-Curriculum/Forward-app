from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserLoginSerializer, UserRegistrationSerializer, UserUpdateSerializer
from core.services import UserService
from .utils import json_go_brrr, messages
from core.models import Quiz, Lesson, TextContent, Poll, PollQuestion, Writing, Question

class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    Endpoint: POST /api/users/
    """
    serializer_class = UserRegistrationSerializer # Handles data validation and user creation
    permission_classes = [AllowAny] # Allows anyone to register (no authentication required)

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
        serializer: UserRegistrationSerializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True) # Validates the data, raises exception if invalid
        user = serializer.save() # Creates the user
        user_data = UserService.login_user(request, user) # Logs the user in and returns user data

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
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
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
                        'text_size': user.text_size
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
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            updated_user = serializer.save()  # Saves the changes to the user model
            return json_go_brrr(
                message="User information updated successfully",
                data={
                    'user': {
                        'id': updated_user.id,
                        'username': updated_user.username,
                        'display_name': updated_user.display_name,
                        'facility_id': updated_user.facility_id,
                        'profile_picture': updated_user.profile_picture,
                        'consent': updated_user.consent,
                        'preferences': {
                            'theme': user.theme,
                            'text_size': user.text_size
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
    '''
    tests endpoint/ endpoints
    '''
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        '''
        gets a quiz by its lesson id
        '''
        [id] = kwargs.values()
        quiz = Quiz.objects.get(lesson_id=id)

        if not quiz:
            return Response({"detail":"cannot find quiz with this id"}, status=status.HTTP_404_NOT_FOUND)

        questions = Question.objects.filter(quiz_id=quiz.id)

        return Response({
            "detail": messages['successful_id'],
            "data": {
                "quiz":quiz.to_dict(),
                "questions": [q.to_dict() for q in questions]}},
            status=status.HTTP_200_OK
            )


    def post(self, req, *args, **kwargs):
        '''
        submits a quiz by creating a new userdata row in db
        '''

        # need to make user data table to save to. TBD

class LessonView(APIView):
    permission_classes = [AllowAny]

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

class TextContentView(APIView):
    permission_classes = [AllowAny]

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
    permission_classes = [AllowAny]

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
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
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
