from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from core.models import User, UserQuizResponse, Quiz, Question, BaseResponse, Lesson, ActivityManager, Facility
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for handling user registration in the API.

    This serializer validates and processes user registration data, ensuring:
    - Password meets Django's validation requirements
    - Password confirmation matches
    - Required fields are provided
    - User creation follows service layer pattern
    """
    
    facility = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        # Uses Django's built-in password validation
        validators=[validate_password],
        # Renders as password field in browsable API
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate_facility(self, value):
        """
        Case-insensitively validate the facility code and return the Facility object.
        """
        # If no facility code is provided, return None, as it's an optional field.
        if not value:
            return None
        try:
            # Perform a case-insensitive lookup on the Facility model.
            return Facility.objects.get(code__iexact=value)
        except Facility.DoesNotExist:
            raise serializers.ValidationError("A facility with this code does not exist.")

    class Meta:
        model = User
        fields = [
            'username',
            'password',
            'password_confirm',
            'display_name',
            'facility',
            'consent',
            'surveyed_at'
        ]
        extra_kwargs = {
            'display_name': {'required': True},
            'consent': {'required': False, 'default': False},
            'surveyed_at': {'required': False, 'default': None}
        }

    def validate(self, attrs):
        """
        Perform cross-field validation.
        """
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
        try:
            return UserService.create_user(validated_data)
        except DjangoValidationError as e:
            # Normalize to DRF serializer error shape
            detail = getattr(e, "message_dict", None) or getattr(e, "messages", e)
            raise serializers.ValidationError(detail)

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
    theme = serializers.CharField(required=False)
    text_size = serializers.CharField(required=False)
    speech_uri_index = serializers.IntegerField(required=False)
    speech_speed = serializers.FloatField(required=False)

    set_surveyed_now = serializers.BooleanField(required=False)

    def validate(self, attrs: dict):
        theme = attrs.get('theme')
        text_size = attrs.get('text_size')
        if theme:
            if not theme in ['light', 'dark', 'high-contrast']:
                raise serializers.ValidationError(
                    'Theme is not a valid option.',
                    code='validation'
                )

        if text_size:
            if not text_size in ['txt-sm', 'txt-base', 'txt-lg', 'txt-xl']:
                raise serializers.ValidationError(
                    'Text size is not a valid option.',
                    code='validation'
                )

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
        if validated_data.pop("set_surveyed_now", False):
            instance.surveyed_at = timezone.now()
        # Update the instance with validated data
        instance.display_name = validated_data.get(
            'display_name', instance.display_name)
        instance.profile_picture = validated_data.get(
            'profile_picture', instance.profile_picture)
        instance.consent = validated_data.get('consent', instance.consent)
        instance.theme = validated_data.get('theme', instance.theme)
        instance.text_size = validated_data.get(
            'text_size', instance.text_size)
        instance.speech_uri_index = validated_data.get(
            'speech_uri_index', instance.speech_uri_index)
        instance.speech_speed = validated_data.get(
            'speech_speed', instance.speech_speed)

        # Save the instance
        instance.save()

        return instance

# class UserQuestionResponseSerializer(serializers.Serializer):
#     """
#     Serializer for individual question responses within a quiz submission
#     """
#     question_id = serializers.IntegerField(required=True)
#     response_data = serializers.JSONField(required=True)

#     def validate_question_id(self, value):
#         """Validate that the question exists and belongs to the quiz"""
#         quiz_id = self.context.get('quiz_id')
#         if not quiz_id:
#             raise serializers.ValidationError("Quiz ID is required in context")

#         try:
#             question = Question.objects.get(id=value, quiz_id=quiz_id)
#             return value
#         except Question.DoesNotExist:
#             raise serializers.ValidationError(
#                 f"Question with ID {value} does not exist in this quiz")


# class QuizSubmissionSerializer(serializers.Serializer):
#     """
#     Serializer for submitting a complete quiz response
#     """
#     quiz_id = serializers.IntegerField(required=True)
#     is_complete = serializers.BooleanField(default=True)
#     question_responses = UserQuestionResponseSerializer(many=True)

#     def validate_quiz_id(self, value):
#         """Ensure the quiz exists"""
#         try:
#             Quiz.objects.get(id=value)
#             return value
#         except Quiz.DoesNotExist:
#             raise serializers.ValidationError(
#                 f"Quiz with ID {value} does not exist")

#     def to_internal_value(self, data):
#         """
#         Override to set quiz_id in context before validation occurs on nested serializers
#         """
#         # Get the quiz_id from the incoming data
#         quiz_id = data.get('quiz_id')
#         if quiz_id:
#             # Update the context for all nested serializers
#             self.context['quiz_id'] = quiz_id

#         # Continue with normal validation process
#         return super().to_internal_value(data)

#     def validate(self, data: dict):
#         """Validate that all required questions have responses"""
#         quiz_id = data.get('quiz_id')
#         question_responses = data.get('question_responses', [])

#         # Get all questions for this quiz
#         quiz = Quiz.objects.get(id=quiz_id)
#         required_questions = Question.objects.filter(
#             quiz=quiz, is_required=True)

#         # Check if all required questions have responses
#         if data.get('is_complete', True):
#             responded_question_ids = [resp['question_id']
#                                       for resp in question_responses]
#             missing_questions = []

#             for question in required_questions:
#                 if question.id not in responded_question_ids:
#                     missing_questions.append(question.order)

#             if missing_questions:
#                 raise serializers.ValidationError({
#                     'question_responses': f"Missing responses for required questions: {missing_questions}"
#                 })

#         # Add quiz_id to context for question validation
#         # for question_response in question_responses:
#         #     self.context['quiz_id'] = quiz_id

#         return data

# class UserQuizResponseDetailSerializer(serializers.ModelSerializer):
#     """Serializer for retrieving a user's quiz response with details"""
#     question_responses = serializers.SerializerMethodField()

#     class Meta:
#         model = UserQuizResponse
#         fields = [
#             'id', 'quiz', 'score', 'is_complete',
#             'started_at', 'completed_at', 'question_responses'
#         ]

#     def get_question_responses(self, obj):
#         """
#         Get all question responses for this quiz response.
#         """
#         question_responses = obj.question_responses.all()
#         return [qr.to_dict() for qr in question_responses]


class DynamicActivityPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """
    Gets queryset dynamically based on 'ActivityModel' in context.
    """

    def get_queryset(self):
        ActivityModel = self.context.get('activity_config')[0]
        # Check if ActivityModel is provided
        if not ActivityModel:
            raise ImproperlyConfigured(
                "DynamicActivityPrimaryKeyRelatedField requires a valid 'ActivityModel' "
                "class in the serializer context."
            )
        return ActivityModel.objects.all()


class ResponseSerializer(serializers.Serializer):
    """Handles creation/update for various BaseResponse subclasses."""
    # --- Common Input Fields ---
    id = serializers.UUIDField(required=False, allow_null=True)
    lesson_id = serializers.PrimaryKeyRelatedField(
        queryset=Lesson.objects.all())
    associated_activity = DynamicActivityPrimaryKeyRelatedField(
        write_only=True)
    partial_response = serializers.BooleanField(default=True, write_only=True)
    time_spent = serializers.IntegerField(default=0, write_only=True)
    attempts_left = serializers.IntegerField(default=0)
    quiz_id = serializers.UUIDField(required=False)

    submission = serializers.ListField(required=False, allow_empty=True, default=list) # Another test to see how it handles submission

    def validate(self, attrs):
        if 'activity_config' not in self.context:
            raise serializers.ValidationError(
                "Serializer context is missing required models.")
        return attrs

    def save(self, **kwargs):
        """Handles get_or_create/update logic based on context and input."""
        validated_data = {**self.validated_data, **kwargs}

        ResponseModel: BaseResponse = self.context['activity_config'][1]
        ActivityModel = self.context['activity_config'][0]

        activity_type = ActivityModel.__name__.lower()
    
        if activity_type in ActivityManager.registered_services.get("response", {}):

            service_func = ActivityManager.registered_services["response"][activity_type]
            return service_func(validated_data, self.context["request"])
        else:
            try:
                extra_fields = {}
                for key, value in self.context['activity_config'][2].items():
                    # If you get a "not enough values to unpack (expected 2, got 1)", the
                    # default value is probably missing in the activity manager config
                    field_name, default = value
                    extra_fields[key] = self.context['request'].data.get(field_name, default)
                
                response_object, created = ResponseModel.objects.get_or_create(
                    user=self.context['request'].user,
                    associated_activity=validated_data.get(
                        'associated_activity'),
                    lesson=validated_data.get("lesson_id"),
                    id=validated_data.get('id', None),
                    defaults=extra_fields
                )
                
                # update case, as opposed to defaults in creation case
                if not created:
                    for key, value in extra_fields.items():
                        setattr(response_object, key, value)
                        
                response_object.partial_response = validated_data.get(
                    "partial_response", True)
                response_object.time_spent = validated_data.get(
                    "time_spent", 0)
                response_object.attempts_left = validated_data.get(
                    "attempts_left", 0)
                response_object.save()
                   
            except Exception as e:
                # If ID provided but not found for user, treat as error
                raise serializers.ValidationError(
                    {"response_object": f"{ResponseModel.__name__} could not be created or found.", "detail": str(e)})

            return response_object
