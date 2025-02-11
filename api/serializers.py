from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from core.models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only = True,
        required = True,
        validators = [validate_password],
        style = {'input_type': 'password'}
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
            'email',
            'first_name',
            'last_name',
            'date_of_birth'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate(self, attrs):
        # Check if passwords match
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs
    
    def create(self, validated_data):
        # Remove password_confirm from the data
        validated_data.pop('password_confirm', None)

        # Create the user
        from core.services import UserService
        return UserService.create_user(validated_data)