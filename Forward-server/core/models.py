from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
from django.urls import reverse
import uuid

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
        # User's generated uuid
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='the uuid of the database item'
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
        null=True,
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
        default=None
    )
    # Consent to participate in study, alsays assume false
    consent = models.BooleanField(
        'tracking consent',
        max_length=1,
        default=False
    )

    theme = models.CharField(
        'theme preference',
        max_length=13,
        default="light"
    )

    text_size = models.CharField(
        'text size preference',
        max_length=8,
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
            "display_name": self.display_name,
        }

class Lesson(models.Model):
    """
    Represents a lesson in the curriculum.

    A lesson is the top-level educational unit that contains sections, content,
    and activities. It has specific learning objectives and can track student progress.
    """
        # User's generated uuid
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='the uuid of the database item'
    )


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
        # User's generated uuid
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='the uuid of the database item'
    )


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

    @property
    def activity_type(self):
        return self.__class__.__name__

    def to_dict(self):
        return {
            "id": self.id,
            "lesson_id": self.lesson_id,
            "type": self.activity_type,
            "title": self.title,
            "content": self.content,
            "order": self.order
        }

class BaseActivity(models.Model):
    """
    Abstract base class for all activity types in the curriculum.

    This class provides common fields and functionality shared by all
    activity types (Quiz, Poll, Writing Activities)
    """
        # User's generated uuid
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='the uuid of the database item'
    )


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
    
    @property
    def activity_type(self):
        return self.__class__.__name__

    def to_dict(self):
        return {
            "id": self.id,
            "lesson_id": self.lesson_id,
            "type": self.activity_type,
            "title": self.title,
            "instructions": self.instructions,
            "order": self.order
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
            "passing_score": self.passing_score,
            "feedback_config": self.feedback_config,
        }



class Question(models.Model):
    """Model for individual questions within a quiz."""
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('multiple_select', 'Multiple Select'),
    ]
        # User's generated uuid
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='the uuid of the database item'
    )


    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions',
        help_text="The quiz this question belongs to"
    )

    question_text = models.TextField(
        help_text="The text of the question"
    )

    feedback_config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Feedback configuration for this question, with options for correct/incorrect responses"
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
            "quiz_id": self.quiz_id,
            "question_text": self.question_text,
            "question_type": self.question_type,
            "has_orrect_answer": self.has_correct_answer,
            "choices": self.choices,
            "is_required": self.is_required,
            "order": self.order,
            "feedback_config": self.feedback_config
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
        # User's generated uuid
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='the uuid of the database item'
    )

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
            "poll_id": self.poll_id,
            "question_text": self.question_text,
            "options": self.options,
            "allow_multiple": self.allow_multiple,
            "order": self.order,
        }

class UserQuizResponse(models.Model):
    """
    Stores a user's complete response to a quiz
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='quiz_responses',
        help_text='The user who submitted this quiz response'
    )

    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='user_responses',
        help_text='The quiz that was answered'
    )

    score = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="The user's score on this quiz"
    )

    is_complete = models.BooleanField(
        default=False,
        help_text='Whether the quiz has been completed and submitted'
    )

    completion_percentage = models.FloatField(
        default=0.0,
        help_text="Percentage completion of the lesson"
    )

    time_spent = models.IntegerField(
        null=True,
        blank=True,
        help_text='The total time spent on this question'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'quiz']
        verbose_name = 'quiz response'
        verbose_name_plural = 'quiz responses'
    
    def __str__(self):
        return f"{self.user.username}'s response to {self.quiz.title}"
    
    def calculate_score(self):
        """Calculate and set the score based on the question responses"""
        if not self.is_complete:
            return None
        
        # Only count questions that have correct answers defined
        gradable_questions = self.question_responses.filter(
            # self note: This is a field lookup feature in Django's ORM.
            #  Translates to a single JOIN query instead of having to loop through all responses and check each question
            question__has_correct_answer=True
        )

        correct_count = 0
        total_count = gradable_questions.count()

        if total_count == 0:
            return None
        
        for response in gradable_questions:
            if response.is_correct:
                correct_count += 1

        self.score = correct_count
        self.save()

        return self.score
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "quiz_id": self.quiz_id,
            "score": self.score,
            "is_complete": self.is_complete,
            "completion_percentage": self.completion_percentage,
            "time_spent": self.time_spent,
            "question_responses": [qr.to_dict() for qr in self.question_responses.all()]
        }
    
class UserQuestionResponse(models.Model):
    """
    Stores a user's response to an individual question within a quiz
    """
    quiz_response = models.ForeignKey(
        UserQuizResponse,
        on_delete=models.CASCADE,
        related_name='question_responses',
        help_text="The parent quiz response this question response belongs to"
    )

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='user_responses',
        help_text="The question that was answered"
    )

    # Store the selected answer(s) as JSON
    # For multiple choice: {"selected": "option_id"}
    # For multiple select: {"selected": ["option_id1", "option_id2"]}
    # For true/false: {"selected": true} or {"selected": false}
    response_data = models.JSONField(
        help_text="The user's response data in JSON format"
    )

    is_correct = models.BooleanField(
        null=True,
        blank=True,
        help_text="Whether this response is correct (null if not automatically gradable)"
    )

    feedback = models.TextField(
        null=True,
        blank=True,
        help_text="Feedback provided for this response"
    )

    time_spent = models.IntegerField(
        null=True,
        blank=True,
        help_text='The total time spent on this question'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['quiz_response', 'question']
        verbose_name = "question response"
        verbose_name_plural = "question responses"

    def __str__(self):
        return f"Response to question {self.question.order} in {self.quiz_response}"
    
    def evaluate_correctness(self):
        """Determine if the response is correct based on question type and correct answer"""
        if not self.question.has_correct_answer:
            self.is_correct = None
            self.save()
            return None
        
        # Get correct answers from the question
        correct_answers = self.question.choices.get('correct_answers', [])
        selected = self.response_data.get('selected', None)

        # Set default feedback
        feedback_config = self.question.feedback_config or {}
        default_feedback = feedback_config.get('default', '')

        # If nothing's selected, it's incorrect
        if selected is None:
            self.is_correct = False
            self.feedback = feedback_config.get('no_response', default_feedback)
            self.save()
            return False
        
        # Handle different question types
        if self.question.question_type == 'multiple_choice':
            self.is_correct = selected in correct_answers
        elif self.question.question_type == 'multiple_select':
            if not isinstance(selected, list):
                self.is_correct = False
            else:
                self.is_correct = sorted(selected) == sorted(correct_answers)
        elif self.question.question_type == 'true_false':
            self.is_correct = selected == correct_answers
        else:
            # Unknown question type
            self.is_correct = None

        # Set appropriate feedback based on correctness
        if self.is_correct:
            self.feedback = feedback_config.get('correct', default_feedback)
        else:
            self.feedback = feedback_config.get('incorrect', default_feedback)

        self.save()
        return self.is_correct
    
    def to_dict(self):
        return {
            "id": self.id,
            "quiz_response_id": self.quiz_response_id,
            "question_id": self.question_id,
            "response_data": self.response_data,
            "is_correct": self.is_correct,
            "time_spent": self.time_spent,
            "feedback": self.feedback
        }
        

class BaseResponse(models.Model):
    """
    Abstract base model for responses.
    Subclasses MUST define their own 'associatedId' ForeignKey field.
    """
    class Meta:
        abstract = True
        
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='the uuid of the database item'
    )
    
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='%(class)s_lesson',
        null=False,
        blank=False,
        help_text='The lesson related to this response'
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='%(class)s_response_user',
        null=False,
        blank=False,
        help_text='The user who submitted this response'
    )
  
    partial_response = models.BooleanField(null=True, blank=True)
    
    time_spent = models.PositiveIntegerField(default=0)
    
    attempts_left = models.PositiveIntegerField(default=0)
    
    def to_dict(self):
        return {
            "id": self.id,
            "partial_response": self.partial_response,
            "time_spent": self.time_spent,
            "attempts_left": self.attempts_left
        }

class WritingResponse(BaseResponse):
    writing = models.ForeignKey(
        Writing,
        on_delete=models.CASCADE,
        related_name='associated_writing',
        help_text='The writing that was answered'
    )
    
    response = models.CharField(default="",max_length=10000)
    
    def to_dict(self):
        return {
            **super().to_dict(),
            "associated_activity": self.writing.id,
            "response": self.response
            }

class TextContentResponse(BaseResponse):
    text_content = models.ForeignKey(
        TextContent,
        on_delete=models.CASCADE,
        related_name='associated_textcontent',
        help_text='The text content associated with this response'
    )
    
    def to_dict(self):
        return {
            **super().to_dict(),
            "associated_activity": self.text_content.id,
            }

class PollQuestionResponse(BaseResponse):
    response_data = models.JSONField(
        help_text="The user's response data in JSON format"
    )
    
    poll = models.ForeignKey(
        Poll,
        on_delete=models.CASCADE,
        related_name='associated_poll',
        help_text="The poll associated with this question"
    )
    
    def to_dict(self):
        return {
            **super().to_dict(),
            "associated_activity": self.poll.id,
            "response_data": self.response_data
            }
        