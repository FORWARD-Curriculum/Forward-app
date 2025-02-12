from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from core.models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for handling user registration in the API.
    
    This serializer validates and processes user registration data, ensuring:
    - Password meets Django's validation requirements
    - Password confirmation matches
    - Required fields are provided
    - User creation follows service layer pattern
    """
    password = serializers.CharField(
        write_only = True,
        required = True,
        validators = [validate_password], # Uses Django's built-in password validation
        style = {'input_type': 'password'} # Renders as password field in browsable API
    )
    password_confirm = serializers.CharField(
        write_only = True,
        required = True,
        style = {'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'username',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'date_of_birth'
        ]
        # Override default optional fields to make them required
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate(self, attrs):
        """
        Perform cross-field validation.
        
        Args:
            attrs (dict): Dictionary of field values to validate
            
        Returns:
            dict: Validated data
            
        Raises:
            serializers.ValidationError: If passwords don't match
        """
        # Check if passwords match
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs
    
    def create(self, validated_data: dict):
        """
        Create a new user instance.
        
        This method:
        1. Removes the password_confirm field as it's not needed for user creation
        2. Delegates user creation to the UserService layer
        
        Args:
            validated_data (dict): Validated data from the serializer
            
        Returns:
            User: Newly created user instance
        """
        # Remove password_confirm from the data
        validated_data.pop('password_confirm', None)

        # Delegate user creation to the service layer
        from core.services import UserService
        return UserService.create_user(validated_data)
    
class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs: dict):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(
                request=self.context.get('request'),
                username=username,
                password=password
            )
            if not user:
                raise serializers.ValidationError(
                    'Unable to log in with provided credentials.',
                    code='authorization'
                )
        else:
            raise serializers.ValidationError(
                'Must include "username" and "password".',
                code='authorization'
            )
        
        attrs['user'] = user
        return attrs