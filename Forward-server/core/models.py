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
    first_name = models.CharField(
        'first name',
        max_length=50,
        validators=[MinLengthValidator(2)]
    )

    # User's last name - minimum 2 characters required
    last_name = models.CharField(
        'last name',
        max_length=50,
        validators=[MinLengthValidator(2)]
    )

    # Automatically set when the user is created and updated
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_full_name(self):
        """
        Return the user's full name
        """
        full_name = f'{self.first_name} {self.last_name}'
        return full_name.strip()
    
    def __str__(self):
        """
        String representation of the user - returns username
        Used in Django admin and whenever a user object is printed
        """
        return self.username

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
    
