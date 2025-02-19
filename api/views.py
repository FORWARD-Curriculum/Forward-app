from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserLoginSerializer, UserRegistrationSerializer
from core.services import UserService

class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    
    This view handles POST requests for creating new user accounts. It:
    - Allows unauthenticated access
    - Validates user registration data
    - Creates new user accounts
    - Returns the created user's details
    
    Endpoint: POST /api/register/
    
    Returns:
        201 Created - On successful registration
        400 Bad Request - If validation fails
    """
    serializer_class = UserRegistrationSerializer # Handles data validation and user creation
    permission_classes = [AllowAny] # Allows anyone to register (no authentication required)

    def create(self, request, *args, **kwargs):
        """
        Handle the user registration process.
        
        This method:
        1. Validates the incoming registration data
        2. Creates the user if validation passes
        3. Returns the newly created user's details
        
        Args:
            request: The HTTP request object
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
            
        Returns:
            Response: JSON response containing:
                - Success message
                - User details (id, username, email, first_name, last_name)
                
        Raises:
            ValidationError: If the registration data is invalid
        """
        serializer: UserRegistrationSerializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True) # Validates the data, raises exception if invalid
        user = serializer.save() # Creates the user
        user_data = UserService.login_user(request, user) # Logs the user in and returns user data  

        return Response({
            "message": "User registered successfully",
            'user': user_data
        }, status=status.HTTP_201_CREATED)
    
class SessionView(APIView):
    """
    API endpoint for managing user sessions.
    
    GET: Retrieve current user's session information
    POST: Create a new session (login)
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

        return Response({
            'message': 'Login successful',
            'user': user_data
        }, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        """End the current session (logout)"""
        UserService.logout_user(request)
        return Response({
            'message': 'Logout successful',
        }, status=status.HTTP_200_OK)
        
class CurrentUserView(APIView):
    """Endpoint for retrieving current user information"""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Return the current user's information.
        Only accessible to authenticated users.
        """
        user = request.user
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })