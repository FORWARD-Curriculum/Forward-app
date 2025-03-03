from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
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
            'display_name',
            'facility_id',
            'consent'
        ]
        # Override default optional fields to make them required
        extra_kwargs = {
            'display_name': {'required': True},
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

        if not username or not password:
            raise serializers.ValidationError(
                'Both username and password are required.',
                code='validation'
            )

        user = authenticate(
            request=self.context.get('request'),
            username=username,
            password=password
        )
        
        if not user:
            raise AuthenticationFailed('Invalid credentials')

        attrs['user'] = user
        return attrs
    
class UserUpdateSerializer(serializers.Serializer):
    display_name = serializers.CharField(required=False)
    profile_picture = serializers.CharField(required=False, allow_null=True)
    consent = serializers.BooleanField(required=False)
    
    def validate(self, attrs: dict):
        return attrs
    
    def update(self, instance, validated_data):
        """
        Updates a User instance with new data.
        
        This method:
        1. Validates thhe user data follows spec
        2. Replaces any old user info if new info is passed on
        
        Args:
            validated_data (dict): Validated data from the serializer
            
        Returns:
            instance: an updated user instance
        """
        # Update the instance with validated data
        instance.display_name = validated_data.get('display_name', instance.display_name)
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.consent = validated_data.get('consent', instance.consent)
        
        # Save the instance
        instance.save()
        
        return instance