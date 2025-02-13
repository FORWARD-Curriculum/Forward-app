from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
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
    
    Request body:
    {
        "username": "string",
        "password": "string",
        "password_confirm": "string",
        "email": "string",
        "first_name": "string",
        "last_name": "string",
        "date_of_birth": "YYYY-MM-DD"
    }
    
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
    
class UserLoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer: UserLoginSerializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        user_data = UserService.login_user(request, user)

        return Response({
            'message': 'Login successful',
            'user': user_data
        }, status=status.HTTP_200_OK)
        
class UserLogoutView(APIView):
    def post(self, request, *args, **kwargs):
        print(request)
        UserService.logout_user(request)
        return Response({
            'message': 'Logout successful',
        }, status=status.HTTP_200_OK)