from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
from django.urls import reverse


# Custom User model that extends Django's AbstractUser
# This gives us all the default user functionality (username, password, groups, permissions)
# while allowing us to add our own custom fields and methods
class User(AbstractUser):
    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'

    # By default, Django requires email for user creation
    # We override this to make email optional since we're using username-based auth
    REQUIRED_FIELDS = []
    email = models.EmailField(
        'email address',
        blank=True,
        null=True
    )

    # User's first name - minimum 2 characters required
    display_name = models.CharField(
        'display name',
        max_length=50,
        validators=[MinLengthValidator(2)],
    )

    # Facility Id - Still need to decide how we are implementing
    facility_id = models.CharField(
        'facility id',
        max_length=50,
        validators=[MinLengthValidator(2)],
        blank=True
    )

    # Optional
    profile_picture = models.CharField(
        'profile picture link',
        max_length=50,
        null=True,
        blank=True,
        validators=[MinLengthValidator(2)]
    )
    # Consent to participate in study, alsays assume false
    consent = models.BooleanField(
        'tracking consent',
        max_length=1,
        default=False
    )
    
    theme = models.CharField(
        'theme preference',
        max_length=1,
        default="light"
    )
    
    text_size = models.CharField(
        'text size preference',
        max_length=1,
        default="txt-base"
    )
    
    speech_uri_index = models.PositiveIntegerField(
        'webSpeech uri',
        null=True,
        blank=True,
    )
    
    speech_speed = models.FloatField(
        'webSpeech speed',
        null=True,
        blank=True,
    )

    # Automatically set when the user is created and updated
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # This is not data we collect, its ugly but the other option is to inherit 
    # from AbstractBaseUser and all the stuff that comes with that
    first_name = None
    last_name = None

    def __str__(self):
        """
        String representation of the user - returns username
        Used in Django admin and whenever a user object is printed
        """
        return self.username

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "displayName": self.display_name,
        }

class Lesson(models.Model):
    """
    Represents a lesson in the curriculum.

    A lesson is the top-level educational unit that contains sections, content,
    and activities. It has specific learning objectives and can track student progress.
    """

    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3)],
        help_text="The title of the lesson"
    )

    description = models.TextField(
        help_text="A detailed description of what the lesson covers"
    )

    objectives = models.JSONField(
        default=list,
        help_text="List of learning objectives for this lesson"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Optional fields for lesson organization and metadata
    order = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Optional ordering within a curriculum"
    )

    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Tags for categorizing and searching lessons"
    )

    class Meta:
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['order']),
        ]

    def __str__(self):
        return self.title

    @property
    def section_count(self):
        """Returns the number of sections in this lesson."""
        return self.sections.count()

    def get_ordered_sections(self):
        """Returns all sections for this lesson in their specified order."""
        return self.sections.all().order_by('order')

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "objectives": self.objectives,
            "order": self.order,
            "tags": self.tags,
        }

class TextContent(models.Model):
    """
    Model for text-based content sections within a lesson.
    Can contain formatted text, HTML, or markdown content.
    """
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='text_contents',
        help_text="The lesson this content belongs to"
    )

    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3)],
        help_text="The title of this content section"
    )

    content = models.TextField(
        help_text="The main content text, can include HTML/markdown formatting"
    )

    order = models.PositiveIntegerField(
        help_text="Order within the lesson"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = "text content"
        verbose_name_plural = "text contents"

    def __str__(self):
        return f"Text Content: {self.title}"

    def to_dict(self):
        return {
            "id": self.id,
            "lessonId": self.lesson_id,
            "title": self.title,
            "content": self.content,
            "order": self.order,
        }

class BaseActivity(models.Model):
    """
    Abstract base class for all activity types in the curriculum.

    This class provides common fields and functionality shared by all
    activity types (Quiz, Poll, Writing Activities)
    """
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="%(class)s_activities",  # Will create writing_activities, quiz_activities, poll_activities
        help_text="The lesson this activity belongs to"
    )

    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3)],
        help_text="The title of the activity"
    )

    instructions = models.TextField(
        help_text="Instructions for completing the activity"
    )

    order = models.PositiveIntegerField(
        help_text="Order within the lesson"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True  # Makes this a base class - won't create a table
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.__class__.__name__} - {self.title}"

    def to_dict(self):
        return {
            "id": self.id,
            "lessonId": self.lesson_id,
            "title": self.title,
            "instructions": self.instructions,
            "order": self.order,
        }

class Writing(BaseActivity):
    """Model for writing activities where students provide written responses."""
    prompts = models.JSONField(
        default=list,
        help_text="List of writing prompts for the activity"
    )

    class Meta(BaseActivity.Meta):
        verbose_name = "writing activity"
        verbose_name_plural = "writing activities"

    def get_prompts(self):
        """Returns the list of prompts or an empty list if none set"""
        return self.prompts or []

    def to_dict(self):
        return {
            **super().to_dict(),
            "prompts": self.prompts
        }


class Quiz(BaseActivity):
    """Model for quiz activities that contain multiple questions and track scores."""
    passing_score = models.PositiveIntegerField(
        help_text="Minimum score required to pass the quiz"
    )

    feedback_config = models.JSONField(
        default=dict,
        help_text="Configuration for feedback based on score ranges"
    )

    class Meta(BaseActivity.Meta):
        verbose_name = "quiz"
        verbose_name_plural = "quizzes"

    def to_dict(self):
        return {
            **super().to_dict(),
            "passingScore": self.passing_score,
            "feedbackConfig": self.feedback_config,
        }



class Question(models.Model):
    """Model for individual questions within a quiz."""
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('multiple_select', 'Multiple Select'),
    ]

    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions',
        help_text="The quiz this question belongs to"
    )

    question_text = models.TextField(
        help_text="The text of the question"
    )

    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPES,
        help_text="The type of question"
    )

    has_correct_answer = models.BooleanField(
        default=True,
        help_text="Whether this question has correct answers"
    )

    choices = models.JSONField(
        help_text="Available choices and correct answers in JSON format"
    )

    is_required = models.BooleanField(
        default=True,
        help_text="Whether this question must be answered"
    )

    order = models.PositiveIntegerField(
        help_text="Order within the quiz"
    )

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Question {self.order}: {self.question_text[:50]}..."

    def to_dict(self):
        return {
            "id": self.id,
            "quizId": self.quiz_id,
            "questionText": self.question_text,
            "questionType": self.question_type,
            "hasCorrectAnswer": self.has_correct_answer,
            "choices": self.choices,
            "isRequired": self.is_required,
            "order": self.order,
        }



class Poll(BaseActivity):
    """
    Model for Poll activities. Unlike quizzes, polls don't have correct answers and focus on collecting
    and optionally displaying aggregate responses.
    """
    config = models.JSONField(
        default=dict,
        help_text="Configuration options for poll display and behavior"
    )

    class Meta:
        verbose_name = "poll"
        verbose_name_plural = "polls"

    def to_dict(self):
        return {
            **super().to_dict(),
            "config": self.config
        }

class PollQuestion(models.Model):
    """Models for individual poll questions within a poll"""
    poll = models.ForeignKey(
        Poll,
        on_delete=models.CASCADE,
        related_name="polls",
        help_text="The poll this poll question belongs to"
    )

    question_text = models.TextField(
        help_text="The text of the poll question"
    )

    options = models.JSONField(
        help_text="Available options for the poll question"
    )

    allow_multiple = models.BooleanField(
        default=False,
        help_text="Whether multiple options can be selected"
    )

    order = models.PositiveIntegerField(
        help_text="Order within the poll"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Poll Question {self.order}: {self.question_text[:50]}..."

    def to_dict(self):
        return {
            "id": self.id,
            "pollId": self.poll_id,
            "questionText": self.question_text,
            "options": self.options,
            "allowMultiple": self.allow_multiple,
            "order": self.order,
        }
