from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from core.models import User, UserQuizResponse, UserQuestionResponse, Quiz, Question, Poll, PollQuestion

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
    theme= serializers.CharField(required=False)
    text_size = serializers.CharField(required=False)
    speech_uri_index = serializers.IntegerField(required=False)
    speech_speed = serializers.FloatField(required=False)

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
        # Update the instance with validated data
        instance.display_name = validated_data.get('display_name', instance.display_name)
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.consent = validated_data.get('consent', instance.consent)
        instance.theme = validated_data.get('theme', instance.theme)
        instance.text_size = validated_data.get('text_size', instance.text_size)
        instance.speech_uri_index = validated_data.get('speech_uri_index', instance.speech_uri_index)
        instance.speech_speed = validated_data.get('speech_speed', instance.speech_speed)

        # Save the instance
        instance.save()

        return instance

class UserQuestionResponseSerializer(serializers.Serializer):
    """
    Serializer for individual question responses within a quiz submission
    """
    question_id = serializers.IntegerField(required=True)
    response_data = serializers.JSONField(required=True)

    def validate_question_id(self, value):
        """Validate that the question exists and belongs to the quiz"""
        quiz_id = self.context.get('quiz_id')
        if not quiz_id:
            raise serializers.ValidationError("Quiz ID is required in context")

        try:
            question = Question.objects.get(id=value, quiz_id=quiz_id)
            return value
        except Question.DoesNotExist:
            raise serializers.ValidationError(f"Question with ID {value} does not exist in this quiz")

class QuizSubmissionSerializer(serializers.Serializer):
    """
    Serializer for submitting a complete quiz response
    """
    quiz_id = serializers.IntegerField(required=True)
    is_complete = serializers.BooleanField(default=True)
    question_responses = UserQuestionResponseSerializer(many=True)

    def validate_quiz_id(self, value):
        """Ensure the quiz exists"""
        try:
            Quiz.objects.get(id=value)
            return value
        except Quiz.DoesNotExist:
            raise serializers.ValidationError(f"Quiz with ID {value} does not exist")

    def to_internal_value(self, data):
        """
        Override to set quiz_id in context before validation occurs on nested serializers
        """
        # Get the quiz_id from the incoming data
        quiz_id = data.get('quiz_id')
        if quiz_id:
            # Update the context for all nested serializers
            self.context['quiz_id'] = quiz_id

        # Continue with normal validation process
        return super().to_internal_value(data)

    def validate(self, data: dict):
        """Validate that all required questions have responses"""
        quiz_id = data.get('quiz_id')
        question_responses = data.get('question_responses', [])

        # Get all questions for this quiz
        quiz = Quiz.objects.get(id=quiz_id)
        required_questions = Question.objects.filter(quiz=quiz, is_required=True)

        # Check if all required questions have responses
        if data.get('is_complete', True):
            responded_question_ids = [resp['question_id'] for resp in question_responses]
            missing_questions = []

            for question in required_questions:
                if question.id not in responded_question_ids:
                    missing_questions.append(question.order)

            if missing_questions:
                raise serializers.ValidationError({
                    'question_responses': f"Missing responses for required questions: {missing_questions}"
                })

        # Add quiz_id to context for question validation
        # for question_response in question_responses:
        #     self.context['quiz_id'] = quiz_id

        return data

class UserQuizResponseDetailSerializer(serializers.ModelSerializer):
    """Serializer for retrieving a user's quiz response with details"""
    question_responses = serializers.SerializerMethodField()

    class Meta:
        model = UserQuizResponse
        fields = [
            'id', 'quiz', 'score', 'is_complete',
            'started_at', 'completed_at', 'question_responses'
        ]

    def get_question_responses(self, obj):
        """
        Get all question responses for this quiz response.
        """
        question_responses = obj.question_responses.all()
        return [qr.to_dict() for qr in question_responses]


class UserPollQuestionResponseSerializer(serializers.Serializer):
    """
    Serializer for individual poll question responses within a poll submission.
    Validates the question ID against the poll context.
    """
    question_id = serializers.UUIDField(required=True)
    response_data = serializers.JSONField(required=True)

    def validate_question_id(self, value):
        """Validate that the poll question exists and belongs to the poll."""
        poll_id = self.context.get('poll_id')
        if not poll_id:
            raise serializers.ValidationError("Poll ID is required in context for question validation.")

        try:
            # Check if the question exists and is part of the specific poll
            question = PollQuestion.objects.get(id=value, poll_id=poll_id)
            return value
        except PollQuestion.DoesNotExist:
            raise serializers.ValidationError(f"Poll Question with ID {value} does not exist in poll {poll_id}.")
        except ValueError:
             # Handle case where value is not a valid UUID format
             raise serializers.ValidationError(f"Invalid ID format for Poll Question: {value}.")


class PollSubmissionSerializer(serializers.Serializer):
    """
    Serializer for submitting a complete poll response.
    Validates the poll ID and the structure/content of individual question responses.
    """
    poll_id = serializers.UUIDField(required=True)
    is_complete = serializers.BooleanField(default=True)
    question_responses = UserPollQuestionResponseSerializer(many=True)

    def validate_poll_id(self, value):
        """Ensure the poll exists."""
        try:
            Poll.objects.get(id=value)
            return value
        except Poll.DoesNotExist:
            raise serializers.ValidationError(f"Poll with ID {value} does not exist.")
        except ValueError:
             # Handle case where value is not a valid UUID format
             raise serializers.ValidationError(f"Invalid ID format for Poll: {value}.")

    def to_internal_value(self, data):
        """
        Override to set poll_id in context before validation occurs on nested serializers.
        """
        poll_id = data.get('poll_id')
        if poll_id:
            # Ensure it's added to the context dictionary
            # Create context if it doesn't exist
            if self.context is None:
                 self.context = {}
            self.context['poll_id'] = poll_id

        # Continue with the normal validation process
        return super().to_internal_value(data)

    def validate_question_responses(self, responses):
        """
        Validate the list of question responses.
        Checks response format against PollQuestion's allow_multiple setting.
        """
        # Retrieve poll_id from context, already validated by to_internal_value/validate_poll_id
        poll_id = self.context.get('poll_id')
        if not poll_id:
             raise serializers.ValidationError("Poll ID context is missing for response validation.") # Should not happen

        submitted_q_ids = set()
        for index, resp_data in enumerate(responses):
            question_id = resp_data.get('question_id')
            response_content = resp_data.get('response_data', {}).get('selected')

            # Check for duplicate question submissions within the same payload
            if question_id in submitted_q_ids:
                 raise serializers.ValidationError({
                     f"question_responses[{index}]": f"Duplicate response submitted for question ID {question_id}."
                 })
            submitted_q_ids.add(question_id)

            # Retrieve the question instance added to context by the nested serializer
            question = self.context.get(f'question_{question_id}')
            if not question:
                # This should only happen if validate_question_id failed earlier but somehow validation continued.
                # Or if context passing failed. Added as a safeguard.
                 try:
                     question = PollQuestion.objects.get(id=question_id, poll_id=poll_id)
                 except PollQuestion.DoesNotExist:
                     # Error already raised by nested serializer, but double-check
                     raise serializers.ValidationError({
                        f"question_responses[{index}]": f"Question ID {question_id} validation failed or context missing."
                     })

            # Validate response format based on allow_multiple
            if question.allow_multiple:
                # Expect a list for 'selected'
                if not isinstance(response_content, list):
                    raise serializers.ValidationError({
                        f"question_responses[{index}]": f"Response for question ID {question_id} should be a list (allow_multiple is True)."
                    })
            else:
                # Expect a single value (string, int, bool depending on options), not a list
                if isinstance(response_content, list):
                     raise serializers.ValidationError({
                         f"question_responses[{index}]": f"Response for question ID {question_id} should not be a list (allow_multiple is False)."
                     })
            # Further validation could check if selected options actually exist in question.options

        return responses

    def validate(self, data):
        """
        Perform object-level validation after individual fields and nested fields.
        """
        # Example: Check if all questions in the poll were answered (if required)
        # For polls, usually answering is optional unless specified otherwise.
        # The validation in validate_question_responses covers the format check.
        # You could add checks here if polls have required questions, similar to the quiz serializer.

        # For now, mainly rely on field and nested field validation.
        return data
