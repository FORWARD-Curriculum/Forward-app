from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator
from django.urls import reverse
from django.core.validators import FileExtensionValidator
import uuid
import boto3  # pyright: ignore[reportMissingImports]
from django.conf import settings
# pyright: ignore[reportMissingImports]
from botocore.exceptions import ClientError
import re
import json
import copy
from django_jsonform.models.fields import JSONField
from martor.models import MartorField
from django.utils.safestring import mark_safe
from django.core.files.storage import default_storage


# Custom User model that extends Django's AbstractUser
# This gives us all the default user functionality (username, password, groups, permissions)
# while allowing us to add our own custom fields and methods

class Facility(models.Model):
    """
    Represents an facility that users can be associated with.
    """
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=50, unique=True,
                            help_text="Unique code for the facility, used for user association on signup")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name}"
    
    class Meta:
        verbose_name = 'Facility'
        verbose_name_plural = 'Facilities'


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

    facility = models.ForeignKey(
        Facility,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="The facility this user is associated with, if any"
    )

    # User's first name - minimum 2 characters required
    display_name = models.CharField(
        'display name',
        max_length=50,
        validators=[MinLengthValidator(2)],
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
    surveyed_at = models.DateTimeField(null=True, blank=True, default=None)

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
            'id': self.id,
            'username': self.username,
            'display_name': self.display_name,
            'facility': self.facility.name if self.facility else None,
            'profile_picture': self.profile_picture,
            'consent': self.consent,
            'surveyed_at': self.surveyed_at,
            'preferences': {
                'theme': self.theme,
                'text_size': self.text_size,
                'speech_uri_index': self.speech_uri_index,
                'speech_speed': self.speech_speed
            }
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
    
    active = models.BooleanField(default=False, help_text="Wether or not the lesson is shown to students. Keep this unchecked until you\
        are ready for students to start taking this lesson.")

    description = models.TextField(
        help_text="A detailed description of what the lesson covers"
    )

    objectives = JSONField(
        default=list,
        schema={"type": "array", "items": {"type": "string"}},
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

    tags = JSONField(
        schema={"type": "array", "items": {"type": "string"}},
        default=list,
        blank=True,
        help_text="Tags for categorizing and searching lessons"
    )
    
    # image = models.CharField(null=True, blank=True, max_length=200, help_text="Optional image to represent the lesson")
    image = models.ImageField(upload_to='public/lesson/', null=True, blank=True,
                              help_text="Optional image to represent the lesson in the dashboard")

    class Meta:
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['order']),
        ]
        verbose_name = "Lesson"
        verbose_name_plural = "Lessons"

    def __str__(self):
        return f"{self.title} - {self.total_activities} Activities"

    @property
    def section_count(self):
        """Returns the number of sections in this lesson."""
        return self.sections.count()

    @property
    def total_activities(self):
        """Returns the count of all top-level activities associated with this lesson."""
        manager = ActivityManager()
        total = 0
        for _, (ActivityClass, _, __, child_class, ___) in manager.registered_activities.items():
            if child_class:
                continue
            total += ActivityClass.objects.filter(lesson_id=self.id).count()
        return total+1

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
            "image": self.image.url if self.image else None,
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
        # Will create writing_activities, quiz_activities, poll_activities
        blank=False,
        null=False,
        related_name="%(class)s_activities",
        help_text="The lesson this activity belongs to"
    )

    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3)],
        help_text="The title of the activity"
    )
    
    order = models.PositiveIntegerField(
        help_text="Order of the activity within the lesson. When creating a new activity,<br> this value should be 1 + the number of activities in the lesson found above."
    )

    instructions = MartorField(
        verbose_name="Instructions",
        null=True,
        blank=True,
        help_text="Instructions for completing the activity"
    )
    
    instructions_image = models.ImageField(
        upload_to="public/instructions/",
        blank=True, null=True,
        help_text="An optional helpful image to display alongside the instructions.")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True  # Makes this a base class - won't create a table
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.title

    @property
    def activity_type(self):
        return self.__class__.__name__

    def to_dict(self):
        return {
            "id": self.id,
            "lesson_id": self.lesson_id,
            "type": self.activity_type,
            "title": self.title,
            "instructions_image": self.instructions_image.url if self.instructions_image else None,
            "instructions": self.instructions,
            "order": self.order
        }


class TextContent(BaseActivity):
    """
    Model for text-based content sections within a lesson.
    Can contain formatted text, HTML, or markdown content.
    """
    # User's generated uuid
    content = MartorField(
        null=True, blank=True,
        help_text="The main content text, can include HTML/markdown formatting"
    )

    # image = models.TextField(
    #     null=True, blank=True, help_text="Optional image to accompany the text content")
    
    image = models.ImageField(upload_to='public/textcontent/', null=True, blank=True, help_text="Optional image to accompany the text content")
    

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = "Reading"
        verbose_name_plural = "Readings"

    def __str__(self):
        return self.title

    @property
    def activity_type(self):
        return self.__class__.__name__

    def to_dict(self):
        return {
            **super().to_dict(),
            "content": self.content,
            "image": self.image.url if self.image else None,
        }


class Video(BaseActivity):
    """
    Model for video content within a lesson.
    Can be used to embed videos from external sources or local files.
    """
    video = models.FileField(
        upload_to="public/video/",
        validators=[FileExtensionValidator(allowed_extensions=['mp4'])])

    scrubbable = models.BooleanField(
        default=False,
        help_text="Whether the video can be scrubbed by the user"
    )

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = "Video"
        verbose_name_plural = "Videos"

    def __str__(self):
        return f"Video Content: {self.title}"

    def to_dict(self):
        return {
            **super().to_dict(),
            "video": self.video.url if self.video else None,
        }


class Writing(BaseActivity):
    """Model for writing activities where students provide written responses."""
    prompts = JSONField(
        schema={"type": "array", "items": {"type": "string", 'widget': 'textarea'}},
        default=list,
        help_text="List of writing prompts for the activity"
    )

    class Meta(BaseActivity.Meta):
        verbose_name = "Writing"
        verbose_name_plural = "Writings"

    def get_prompts(self):
        """Returns the list of prompts or an empty list if none set"""
        return self.prompts or []

    def to_dict(self):
        return {
            **super().to_dict(),
            "prompts": self.prompts
        }


class Identification(BaseActivity):
    """Model for students to identify key phrases or concepts in a text."""
    content = MartorField(
    )
    
    # TODO: implement image/pdf coordinate based identification
    
    class Meta:
        verbose_name = "Identification"
        verbose_name_plural = "Identifications"

    minimum_correct = models.PositiveIntegerField(default=0)

    feedback = models.CharField(max_length=2000, default="")

    def to_dict(self):
        return {
            **super().to_dict(),
            "content": self.content,
            "minimum_correct": self.minimum_correct,
            "feedback": self.feedback
        }


class Quiz(BaseActivity):
    """Model for quiz activities that contain multiple questions and track scores."""
    passing_score = models.PositiveIntegerField(
        help_text="Minimum score required to pass the quiz",
        default=80
    )

    feedback_config = JSONField(
        schema={
            "type": "object",
            "properties": {
                "correct": {"type": "string"},
                "incorrect": {"type": "string"}
            },
            "required": ["correct", "incorrect"]
        },
        default=dict,
        help_text="Configuration for correct/incorrect feedback"
    )

    class Meta(BaseActivity.Meta):
        verbose_name = "Quiz"
        verbose_name_plural = "Quizzes"

    def to_dict(self):
        return {
            **super().to_dict(),
            "passing_score": self.passing_score,
            "feedback_config": self.feedback_config,
            "questions": [q.to_dict() for q in Question.objects.filter(quiz__id=self.id).order_by('order')]
        }


class Twine(BaseActivity):
    """Model for Twine activities, which are interactive stories or games."""
    file = models.FileField(
        upload_to="public/twine/",
        validators=[FileExtensionValidator(allowed_extensions=['html'])],
        help_text=mark_safe("""  
                            An exported twine file with the extension ".html"<br>
                            <br>
                            The Twine story format must be "SugarCube", and in order to inform the
                            app that a student has finshed the story, all ending passages must include the
                            following text somewhere within them:<br>
                            <br>
                            <code>
                                &lt;&lt;script&gt;&gt;<br>
                                window.parent.postMessage({ type: "twineEnd" }, "*");<br>
                                &lt;&lt;/script&gt;&gt;<br>
                            </code><br>
                            
                            All images in the twine file should be prefixed with <code>image:&lt;filename&gt;</code>
                            where the filename does not have any spaces (reccomended replace with underscores)    
                            """
        ), blank=False, null=False
    )

    class Meta(BaseActivity.Meta):
        verbose_name = "Twine Story"
        verbose_name_plural = "Twine Stories"

    def to_dict(self):
        result = None
        if self.file and self.file.name:
            with self.file.open('r') as f:
                result = re.sub(
                    r"image:(.*?\.(jpe?g|png|gif|bmp|webp|tiff?))",
                    lambda m: f"image:{default_storage.url(f'public/twine/images/{m.group(1)}')} ",
                    f.read()
                )
               
        return {
                    **super().to_dict(),
                    "file": result,
                }


class Question(models.Model):
    """Model for individual questions within a quiz."""
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('multiple_select', 'Multiple Select'),
    ]
    # User's ge`ne`rated uuid
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

    question_text = MartorField(
        help_text="The text of the question"
    )

    feedback_config = JSONField(
        schema={
            "type": "object",
            "properties": {
                "correct": {"type": "string",'widget': 'textarea'},
                "incorrect": {"type": "string",'widget': 'textarea'}
            },
            "required": ["correct", "incorrect"]
        },
        default=dict,
        help_text="Feedback configuration for correct/incorrect responses"
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

    choices = JSONField(
        schema={
            "type": "object",
            "properties": {
                "options": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "number"},
                            "text": {"type": "string", 'widget': 'textarea'},
                            "is_correct": {"type": "boolean"}
                        },
                        "required": ["id", "text", "is_correct"]
                    }
                }
            },
            "required": ["options"]
        },
        help_text="Available choices and correct answers for the question"
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
        verbose_name = "Quiz Question"
        verbose_name_plural = "Quiz Questions"

    def __str__(self):
        return f"Question {self.order}: {self.question_text[:50]}..."

    def to_dict(self):
        return {
            "id": self.id,
            "quiz_id": self.quiz_id,
            "question_text": self.question_text,
            "question_type": self.question_type,
            "has_correct_answer": self.has_correct_answer,
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
        verbose_name = "Poll"
        verbose_name_plural = "Polls"

    def to_dict(self):
        return {
            **super().to_dict(),
            "config": self.config,
            "questions": [q.to_dict() for q in PollQuestion.objects.filter(poll__id=self.id).order_by('order')]
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
        verbose_name = "Poll Question"
        verbose_name_plural = "Poll Questions"

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


class Embed(BaseActivity):
    """
    Model for a simple link to be embedded within an activity
    """
    link = models.TextField(
        help_text="a valid link"
    )

    code = models.TextField(
        null=True,
        blank=True,
        default=None,
        help_text="A string of a code to determine if the user may procede"
    )

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = "Web Embed"
        verbose_name_plural = "Web Embeds"

    def __str__(self):
        return f"Embed: {self.title}"

    @property
    def activity_type(self):
        return self.__class__.__name__

    def to_dict(self):
        return {
            **super().to_dict(),
            "link": self.link,
            "has_code": self.code is not None,
        }


class DndMatch(BaseActivity):
    """Model for drag-and-drop matching activities"""

    """
        Stored as an Array of Arrays, in which the first element is the drop target
        and the second and onwards are the drag items. Null values are allowed, and
        correspond to items that have no counterpart associated with them.
        
        Any item may be prefixed with "image:" to indicate that it is an image URL.
        These will be stored in the S3 bucket, and served as presigned URLs on request,
        inlined with the data. They will also be prefixed with "image:" in the payload to
        the frontend to indicate that they are images.
        
        Example:
        [
            ["Trade School", "image:welder.png", "image:electrician.png"],
            ["University", "programmer", "ecologist"],
            ["Typically offers associate level programs for 2 years of study.", "Community College"],
            [null,"red herring drag"],
            ["red herring drop", null]
        ]
    """
    
    strict = models.BooleanField(default=True,
                                 help_text="Whether matches must be exact or if any match is allowed",
                                 null=False, blank=False)

    content = JSONField(
        schema={
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "category":
                        {
                            "title": "Name",
                            "type": "string",
                        },
                    "matches": {
                        "type": "array",
                        "items": {
                            "oneOf": [
                                {
                                    "title": "Type: Text",
                                    "type": "string",
                                },
                                {
                                    "title": "Type: Image",
                                    "type": "object",
                                    "properties": {
                                        "image": {
                                            "type": "string",
                                            "format": "file-url",
                                            "widget": "fileinput",
                                            "title": "Image"
                                        }
                                    },
                                    "required": ["image"]
                                },
                            ]
                        }
                        },
                }
            }
        },
        help_text="List of DND match categories and their associated items"
    )

    class Meta:
        verbose_name = "Drag N' Drop"
        verbose_name_plural = "Drag N' Drops"

    def incorrect_matches(self):
        """Returns a list of the top 3 consistently incorrect matches made by users"""
        responses = DndMatchResponse.objects.filter(
            associated_activity=self
        )

    def to_dict(self):
        content = copy.deepcopy(self.content)
        for group in content:
            for match in group['matches']:
                if isinstance(match, dict) and 'image' in match:
                    match['key'] = match['image']
                    match['image'] = default_storage.url(match['image'])
                    
        return {
            **super().to_dict(),
            "content": content,
            "strict": self.strict
        }

class FillInTheBlank(BaseActivity):
    """
    It receives a comma seperated array, dividing each fill
    in the blank activity type from each other.

    There are three types, mainly 
    
    * Any words accepted
    * Keyword recognition?
    * Drop-down menu for selecting from given options

    """
    class Meta:
        verbose_name = "Fill in the Blank"
        verbose_name_plural = "Fill in the Blanks"
    
    image = models.ImageField(upload_to='public/fillintheblank/images/', blank=True, null=True)

    content = JSONField(
        verbose_name="Sentences",
        schema={
            "type": "array",
            "items": {
                "type": "string", "widget": "textarea"
            }
        },
        help_text= mark_safe("""
                             <details>
                             <summary>Help with formatting Fill in The Blank sentances.</summary>
                               <p>This is an array of strings, where each string can contain special <code>&lt;options&gt;</code> tags to define an interactive element. There are three distinct ways to use these tags:</p>

  <h3>1. Dropdown Menu</h3>
  <p>This use case is for when you want users to select the correct answer from a predefined list.</p>

  <ul>
    <li>
      <strong>Syntax</strong>: The <code>&lt;options&gt;</code> tag contains a comma-separated list of choices. The correct answer is prefixed with an asterisk (<code>*</code>).
    </li>
    <li>
      <strong>Example</strong>: To create a dropdown with "an animal", "a bird", and "a fish" as options, where "an animal" is the correct answer, you would write:
      <pre><code>"Cats are &lt;options&gt;*an animal, a bird, a fish&lt;/options&gt;."</code></pre>
    </li>
  </ul>

  <h3>2. Keyword-Based Text Input</h3>
  <p>This is used for a text input field where multiple different answers could be considered correct.</p>

  <ul>
    <li>
      <strong>Syntax</strong>: The <code>&lt;options&gt;</code> tag includes the <code>keyword="true"</code> attribute and contains a comma-separated list of acceptable answers. The user's input will be marked correct if it matches any of these keywords.
    </li>
    <li>
      <strong>Example</strong>: To create a text field where "blue", "clear", or "bright" are all correct answers, you would write:
      <pre><code>"The sky is &lt;options keyword=\"true\"&gt;blue, clear, bright&lt;/options&gt;."</code></pre>
    </li>
  </ul>

  <h3>3. Free Text Input</h3>
  <p>This is used for an open-ended text input where any non-empty answer is considered correct.</p>

  <ul>
    <li>
      <strong>Syntax</strong>: The <code>&lt;options&gt;</code> tag is left empty.
    </li>
    <li>
      <strong>Example</strong>: To create a simple text input field for a user's favorite color, you would write:
      <pre><code>"My favorite color is &lt;options&gt;&lt;/options&gt;."</code></pre>
    </li>
  </ul></details>""")
    )

    def incorrect_fills(self):
        # imitating DND, guess this is for analytics
        responses = FillInTheBlankResponse.objects.filter( # come back to this
            associated_activity=self
        )



    # delete this later comment later, just for me --> but remakes it into a json to give to frontend
    def to_dict(self):
        return {
            **super().to_dict(),
            "content": self.content,
        }


    
    
class ConceptMap(BaseActivity):
    """Model for mapping concepts to each other"""
    content = MartorField(
        default="",
    )
    class Meta:
        verbose_name = "Concept Map"
        verbose_name_plural = "Concept Maps"

    def to_dict(self):
        return {
            **super().to_dict(),
            "content": self.content,
            "concepts": [c.to_dict() for c in Concept.objects.filter(concept_map=self).order_by('order')]
        }


class Concept(BaseActivity):
    """Model for a concept in the concept map"""
    # TODO use jsonschema to enforce and validate the schema of the example field

    """
    {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "image": {
            "type": "string"|null
          },
          "description": {
            "type": "string"
          }
        },
        "required": [
          "name",
          "logo",
          "description"
        ],
        "additionalProperties": false
      },
    }
    """

    concept_map = models.ForeignKey(
        ConceptMap,
        on_delete=models.CASCADE,
        related_name="concepts",
        help_text="The concept map this concept belongs to"
    )

    image = models.ImageField(upload_to='publiic/concept/', blank=False, null=False, help_text="An image representing the concept.")

    description = MartorField(
        help_text="A detailed description of the concept"
    )

    examples = JSONField(
        schema={
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "image": {"type": "string", "format": "file-url"},
                    "description": {"type": "string"}
                },
                "required": ["name","description"],
                "additionalProperties": False
            }
        },
        help_text="List of examples for this concept"
    )
    
    class Meta:
        verbose_name = "Concept Map Concept"
        verbose_name_plural = "Concept Map Concepts"
    
    def to_dict(self):
        examples = copy.deepcopy(self.examples)
        for item in examples:
            if item.get('image'):
                item['image'] = default_storage.url(item['image'])
        
        return {
            **super().to_dict(),
            "id": self.id,
            "image": self.image.url if self.image else None,
            "description": self.description,
            "examples": examples,
        }
        
# Helper method to generate presigned urls
"""
There might be a better way to do this useing django storages settings setting it to presigned url without creating a client here
Lesser priority but will look into later
"""
def create_presigned_url(s3_key):
    
    if (settings.DEBUG):
        print(f"DEBUG: Starting presigned URL generation for path: {s3_key}")
    
    # Get settings from your STORAGES configuration
    storage_options = settings.STORAGES['default']['OPTIONS']
    s3_client = boto3.client(
        's3',
        endpoint_url=storage_options.get('custom_domain'),  # None for AWS S3
        aws_access_key_id=storage_options.get('access_key'),
        aws_secret_access_key=storage_options.get('secret_key'),
        region_name=storage_options.get('region_name'),
        use_ssl=storage_options.get('use_ssl', True)
    )
    bucket_name = storage_options['bucket_name']
    if (settings.DEBUG):
        print(f"DEBUG: Using bucket: {bucket_name}")
    
    try:
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': s3_key},
            ExpiresIn= 3600, # 3 hour expiration time at the moment
        )
    except ClientError as e:
        if (settings.DEBUG):
            print(f"ERROR: Failed to generate presigned URL: {e}")
        return None
    
    if (settings.DEBUG):
        print(f"SUCCESS: Generated presigned URL: {response}")
    return response

    



def regex_image_sub(tosub: any, key_prefix="", isJson: bool = True):
    """Substitutes image URLs in the input string with presigned URLs.
        Args:
        tosub (str): The input string containing image URLs.
        key_prefix (str): The prefix to add to the S3 key for the image.
        isJson (bool): Whether the input is a JSON string or a regular string.
    Returns:
        str: The modified string with image URLs replaced by presigned URLs.
    """
    result = re.sub(
        r"image:(.*?\.(jpe?g|png|gif|bmp|webp|tiff?))",
        lambda m: f"image:{create_presigned_url(f'public/{key_prefix}{m.group(1)}')}",
        isJson and json.dumps(tosub) or str(tosub)
    )
    return isJson and json.loads(result) or result


class LikertScale(BaseActivity):
    LIKERT_CONTENT_SCHEMA = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "statement": {"type": "string", "widget": "textarea"},
                "scale": {
                    "type": "array",
                    "title": "Scale Markers",
                    "items": {
                        "anyOf": [
                            {"type": "number", "title": "Type: number"},
                            {"type": "string", "title": "Type: text"}
                        ]
                    },
                    "minItems": 2
                    },
                "continuous": {"type": "boolean"}
            },
            "required": ["statement", "scale", "continuous"],
            "additionalProperties": False
            }}
    
    content = JSONField(
        schema=LIKERT_CONTENT_SCHEMA,
        help_text="Content for the Likert scale activity"
    )

    class Meta:
        verbose_name = "Likert Scale"
        verbose_name_plural = "Likert Scales"

    def to_dict(self):
        return {
            **super().to_dict(),
            "content": self.content
        }
        
class Slideshow(BaseActivity):
    
    def get_num_slides(self):
        return Slide.objects.filter(slideshow=self).count()
    
    def to_dict(self):
        return {
            **super().to_dict(),
            "slides": [s.to_dict() for s in Slide.objects.filter(slideshow=self).order_by('order')]
        }
    
class Slide(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='the uuid of the database item'
    )
    
    slideshow = models.ForeignKey(to=Slideshow,on_delete=models.CASCADE, related_name='slides')
    content = MartorField(default="")
    image = models.ImageField(upload_to='public/slideshow/slides/images', blank=True, null=True)
    order = models.PositiveIntegerField(
        default=0,
        blank=False,
        null=False,)
    
    class Meta:
        ordering = ("order",)
    
    
    def to_dict(self):
        return {
            "content": self.content,
            "image": self.image.url if self.image else None
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

    # Meant to be overwritten by subclasses
    associated_activity = None

    partial_response = models.BooleanField(default=True)

    time_spent = models.PositiveIntegerField(default=0)

    attempts_left = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def to_dict(self):
        return {
            "id": self.id,
            "partial_response": self.partial_response,
            "time_spent": self.time_spent,
            "attempts_left": self.attempts_left,
            "associated_activity": self.associated_activity.id,
        }
    
# TODO: Make quiz and question response inherit from BaseResponse, or make
# them adhere to the contract enforced by BaseResponse

class SlideshowResponse(BaseResponse):
    associated_activity = models.ForeignKey(
        Slideshow,
        on_delete=models.CASCADE,
        related_name='slideshow_responses',
        help_text='The slideshow this response is for'
    )
    
    class Meta:
        verbose_name = "Slideshow Response"
        verbose_name_plural = "Slideshow Responses"

    def to_dict(self):
        return {
            **super().to_dict(),
        }

class UserQuizResponse(BaseResponse):
    """
    Stores a user's complete response to a quiz
    """

    # Note to self removing some fields that are inherited by baseResponse
    # Removed user, lesson, associated_activity , partial_response, time_spent, created and updated at --- Lorran Alves Galdino


    score = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="The user's score on this quiz"
    )

    completion_percentage = models.FloatField(
        default=0.0,
        help_text="Percentage completion of the lesson"
    )

    associated_activity = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='quiz_responses',
        help_text='The quiz this response is for'
    )


    class Meta:
        unique_together = ['user', 'associated_activity']  # TODO
        verbose_name = 'quiz response'
        verbose_name_plural = 'quiz responses'

    def __str__(self):
        return f"{self.user.username}'s response to {self.associated_activity.title}"

    def calculate_score(self):
        """Calculate and set the score based on the question responses"""
        if not self.partial_response:
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
            # "user_id": self.user_id,
            "associated_activity": self.associated_activity.id,
            "lesson_id": self.lesson.id,
            "score": self.score,
            "partial_response": self.partial_response,
            "time_spent": self.time_spent,
            "attempts_left": self.attempts_left,
            "score": self.score,
            "completion_percentage": self.completion_percentage,
            "submission": [qr.to_dict() for qr in self.question_responses.all()]
        }

# This might not be the correct approach but I am keeping userQuestionResponses from
#  Inheriting from BaseResponse as I think that teh current structures assume they are an activity
# So I will initialzie all its fields here independently    
class UserQuestionResponse(models.Model): 
    """
    Stores a user's response to an individual question within a quiz
    """
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='%(class)s_lesson',
        null=False,
        blank=False,
        help_text='The lesson related to this question response'
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='%(class)s_response_user',
        null=False,
        blank=False,
        help_text='The user who submitted this question response'
    )

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

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    attempts_left = models.PositiveBigIntegerField(
        default=3,
        help_text="Number of attempts remaining for this question"
    )

    partial_response = models.BooleanField(
        default=True,
        help_text="Whether this is still in progress"
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
            

            self.partial_response = False # No correct answer any should be accepted
            return None

        options = self.question.choices.get('options', [])
        # Get correct answers from the question
        correct_answers = self.question.choices.get('is_correct', [])

        #lets try and extract the ID's of options where is_correct is TRUE
        correct_answer_ids = []
        for opt in options:
            if opt.get('is_correct', False):
                correct_answer_ids.append(opt['id'])

        selected = self.response_data.get('selected', None)

        # Set default feedback
        feedback_config = self.question.feedback_config or {}
        default_feedback = feedback_config.get('default', '')

        # If nothing's selected, it's incorrect
        if selected is None:
            self.is_correct = False
            self.feedback = feedback_config.get(
                'no_response', default_feedback)
            # self.save()
            return False

        # Handle different question types
        if self.question.question_type == 'multiple_choice':
            # self.is_correct = selected in correct_answers
            self.is_correct = selected[0] in correct_answer_ids
        elif self.question.question_type == 'multiple_select':
            if not isinstance(selected, list):
                self.is_correct = False
            else:
                self.is_correct = sorted(selected) == sorted(correct_answer_ids)
        elif self.question.question_type == 'true_false':
            # might need to come back to this one
             self.is_correct = selected in correct_answer_ids or selected == correct_answer_ids
        else:
            # Unknown question type
            self.is_correct = None

        # Set appropriate feedback based on correctness
        if self.is_correct:
            self.feedback = feedback_config.get('correct', default_feedback)
        else:
            self.feedback = feedback_config.get('incorrect', default_feedback)

        # self.save()
        return self.is_correct

    def to_dict(self):
        return {
            "id": self.id,
            "associated_activity": self.question_id,
            "response_data": self.response_data,
            "quiz_id": self.quiz_response.associated_activity.id,
            # "is_correct": self.is_correct,
            "lesson_id": self.lesson_id,
            "partial_response": self.partial_response,
            "time_spent": self.time_spent,
            # "feedback": self.feedback,
            "attempts_left": self.attempts_left,
        }

class VideoResponse(BaseResponse):
    """
    Response model for Video activities.
    """
    associated_activity = models.ForeignKey(
        Video,
        on_delete=models.CASCADE,
        related_name='associated_video',
        help_text='The video activity associated with this response'
    )

    watched_percentage = models.FloatField(
        default=0.0,
        help_text="Percentage of the video that has been watched"
    )

    class Meta:
        verbose_name = "Video Response"
        verbose_name_plural = "Video Responses"

    def to_dict(self):
        return {
            **super().to_dict(),
            "watched_percentage": self.watched_percentage
        }


class DndMatchResponse(BaseResponse):
    """
    Response model for DndMatch activities.
    """
    associated_activity = models.ForeignKey(
        DndMatch,
        on_delete=models.CASCADE,
        related_name='associated_dndmatch',
        help_text='The DnD match activity associated with this response'
    )

    """
    The submission field is a list of list of typles where each inner list contains a tuple of indices into the
    origial content array of the DnDMatch activity. 
    
    Take for example the following content:
    [
            ["Trade School", "image:welder.png", "image:electrician.png"],
            ["University", "programmer", "ecologist"],
            ["Typically offers associate level programs for 2 years of study.", "Community College"],
            [null,"red herring drag"],
            ["red herring drop", null]
    ]
    
    an example of a partial submission with no incorrect answers would be:
    [
        [[0, 1], [0, 2]],
        [[1, 2], [1, 1]],
    ]
    
    an example of a full submission with one incorrect answer would be:
    [
        [[0, 1], [3, 1]],
    ]
    
    """
    submission = JSONField(
        schema={
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "category":
                        {
                            "title": "Name",
                            "type": "string",
                        },
                    "matches": {
                        "type": "array",
                        "items": {
                            "oneOf": [
                                {
                                    "title": "Type: Text",
                                    "type": "string",
                                },
                                {
                                    "title": "Type: Image",
                                    "type": "object",
                                    "properties": {
                                        "image": {
                                            "type": "string",
                                            "format": "file-url",
                                            "widget": "fileinput",
                                            "title": "Image"
                                        }
                                    },
                                    "required": ["image"]
                                },
                            ]
                        }
                        },
                }
            }
        },
    )
    

    class Meta:
        verbose_name = "Drag N' Drop Response"
        verbose_name_plural = "Drag N' Drop Responses"

    def to_dict(self):
        content = copy.deepcopy(self.submission)
        for group in content:
            for match in group['matches']:
                if isinstance(match, dict) and 'image' in match:
                    match['image'] = default_storage.url(match['key'])
                    
        return {
            **super().to_dict(),
            "submission": content
        }

class FillInTheBlankResponse(BaseResponse):
    
    associated_activity = models.ForeignKey(
        FillInTheBlank,
        on_delete=models.CASCADE,
        related_name="associated_fillintheblank",
        help_text="The fill in the blank activity associated with this response"
    )

    submission = models.JSONField(
        help_text="Array of user's answers for each blank"
    )

    class Meta:
        verbose_name = "Fill in the Blank Response"
        verbose_name_plural = "Fill in the Blank Responses"

    def to_dict(self):
        return{
            **super().to_dict(),
            "submission": self.submission
        }


class WritingResponse(BaseResponse):
    associated_activity = models.ForeignKey(
        Writing,
        on_delete=models.CASCADE,
        related_name='associated_writing',
        help_text='The writing that was answered'
    )

    responses = models.JSONField(
        help_text="The user's written responses in JSON Array format",
        default=list
    )

    class Meta:
        verbose_name = "Writing Response"
        verbose_name_plural = "Writing Responses"

    def to_dict(self):
        return {
            **super().to_dict(),
            "responses": self.responses
        }


class TextContentResponse(BaseResponse):
    associated_activity = models.ForeignKey(
        TextContent,
        on_delete=models.CASCADE,
        related_name='associated_textcontent',
        help_text='The text content associated with this response'
    )

    class Meta:
        verbose_name = "Text Content Response"
        verbose_name_plural = "Text Content Responses"

    def to_dict(self):
        return {
            **super().to_dict(),
        }


class TwineResponse(BaseResponse):
    """Response model for Twine activities.
    It's really just a boolean field to indicate if the user has completed the Twine activity."""
    associated_activity = models.ForeignKey(
        Twine,
        on_delete=models.CASCADE,
        related_name='associated_twine',
        help_text='The text content associated with this response'
    )

    class Meta:
        verbose_name = "Twine Response"
        verbose_name_plural = "Twine Responses"

    def to_dict(self):
        return {
            **super().to_dict(),
        }


class PollQuestionResponse(BaseResponse):
    response_data = models.JSONField(
        help_text="The user's response data in JSON format"
    )

    associated_activity = models.ForeignKey(
        Poll,
        on_delete=models.CASCADE,
        related_name='associated_poll_for_question',
        help_text="The poll associated with this question"
    )

    class Meta:
        verbose_name = "Poll Question Response"
        verbose_name_plural = "Poll Question Responses"

    def to_dict(self):
        return {
            **super().to_dict(),
            "response_data": self.response_data
        }


class IdentificationResponse(BaseResponse):
    associated_activity = models.ForeignKey(
        Identification,
        on_delete=models.CASCADE,
        related_name='associated_identification',
        help_text='The identification activity associated with this response'
    )

    class Meta:
        verbose_name = "Identification Response"
        verbose_name_plural = "Identification Responses"

    def to_dict(self):
        return {
            **super().to_dict(),
        }


class PollResponse(BaseResponse):
    associated_activity = models.ForeignKey(
        Poll,
        on_delete=models.CASCADE,
        related_name='associated_poll',
        help_text='The poll associated with this response'
    )

    class Meta:
        verbose_name = "Poll Response"
        verbose_name_plural = "Poll Responses"

    def to_dict(self):
        return {
            **super().to_dict(),
        }


class EmbedResponse(BaseResponse):
    associated_activity = models.ForeignKey(
        Embed,
        on_delete=models.CASCADE,
        related_name='associated_embed',
        help_text='The embed activity associated with this response'
    )

    inputted_code: str = None

    class Meta:
        verbose_name = "Embed Response"
        verbose_name_plural = "Embed Responses"

    def to_dict(self):
        return {
            **super().to_dict(),
            "inputted_code": self.inputted_code
        }


class ConceptMapResponse(BaseResponse):
    associated_activity = models.ForeignKey(
        ConceptMap,
        on_delete=models.CASCADE,
        related_name='associated_conceptmap',
        help_text='The concept map associated with this response'
    )

    class Meta:
        verbose_name = "Concept Map Response"
        verbose_name_plural = "Concept Map Responses"

    def to_dict(self):
        return {
            **super().to_dict(),
        }


class LikertScaleResponse(BaseResponse):
    associated_activity = models.ForeignKey(
        LikertScale,
        on_delete=models.CASCADE,
        related_name='associated_likertscale',
        help_text='The likert scale associated with this response'
    )

    content = models.JSONField(
        help_text="The user's responses to the likert scale"
    )

    class Meta:
        verbose_name = "Likert Scale Response"
        verbose_name_plural = "Likert Scale Responses"

    def to_dict(self):
        return {
            **super().to_dict(),
            "content": self.content
        }


class ActivityManager():
    """A centralized management class meant to streamline the process of creating and using a
    activities within the backend.
    """
    # Enforce a singleton object pattern
    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    registered_activities: dict[str, tuple[BaseActivity, BaseResponse,
                                           dict[str, tuple[str, any]], bool]] = {}
    registered_services: dict[str,
                              dict[BaseActivity, callable]] = {"response": {}}

    def registerActivity(self,
                         ActivityClass: BaseActivity,
                         ResponseClass: BaseResponse,
                         nonstandard_resp_fields: dict[str, tuple[str, any]] = {}, child_class: bool = False):
        """Registers an an activity and associated response class to a globally accessable
        ActivityManager class instance for the purpose of centralizing the activity API to one file.
        This is used in the response views, as well as the services module.

        Args:
            ActivityClass (BaseActivity): The primary activity type. The key for an entry in the\
            `registered_activities` dictionary is based off of the stringified, lowered name of this class.

            ResponseClass (BaseResponse): The associated response type with the aforementioned activity,\
            because we are tracking time for pretty much everything, this should never need to be None.

            nonstandard_resp_fields (dict[str, tuple[str, any]], optional): Possibly a TODO item, this field\
            is used to define fields of a response that are not defined on the BaseResponse type this comes\
            as a dict that is keyed by the field name, and paired with a tuple describing the name expected from\
            the client payload, and the default value if that does not exist. Defaults to {}.

            child_class (bool, optional): Designates if the registering class is specifically a child of another\
            class. This is used in the lesson_service to ensure the activity is not repeated. Defaults to False.
        """
        self.registered_activities[ActivityClass.__name__.lower()] = (
            ActivityClass, ResponseClass, nonstandard_resp_fields, child_class, {})

    def registerService(self, service_type: str, ActivityClass: BaseActivity, service: callable):
        """Registers a service to an activity. This is used to allow for custom services to be registered
        to an activity, such as a custom quiz service. Used for legacy/complex activities to provide more
        behavior than possible with unified API's services.

        Args:
            ActivityClass (BaseActivity): The activity class to register the service to.
            service_name (str): The name of the service.
            service (callable): The service to register.
        """
        if service_type not in self.registered_services:
            raise ValueError(
                f"{service_type} is an invalid service type.")

        self.registered_services[service_type][ActivityClass.__name__.lower(
        )] = service

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.registerActivity(TextContent, TextContentResponse)
        self.registerActivity(Identification, IdentificationResponse)
        self.registerActivity(Writing, WritingResponse, {
                              "responses": ["responses", []]})
        self.registerActivity(Poll, PollResponse)
        self.registerActivity(
            PollQuestion, PollQuestionResponse, child_class=True)
        self.registerActivity(Quiz, UserQuizResponse, {
                                "submission": ["submission", []]}) # test
        # self.registerActivity(Question, UserQuestionResponse, child_class=True) # Testing this
        self.registerActivity(Embed, EmbedResponse, {
                              "inputted_code": ["inputted_code", None]})
        self.registerActivity(ConceptMap, ConceptMapResponse)
        # None here means no response is expected
        self.registerActivity(Concept, None, child_class=True)
        self.registerActivity(DndMatch, DndMatchResponse, {
                              "submission": ["submission", []]})
        self.registerActivity(FillInTheBlank, FillInTheBlankResponse, {
                              "submission": ["submission", []]}) # a little unsure about this part
        self.registerActivity(LikertScale, LikertScaleResponse, {
                              "content": ["content", {}]})
        self.registerActivity(Video, VideoResponse, {
                              "watched_percentage": ["watched_percentage", 0.0]
                              })
        self.registerActivity(Twine, TwineResponse)
        self.registerActivity(Slideshow, SlideshowResponse)


# Register on launch
ActivityManager()

class BugReport(models.Model):
    """
    Model for reporting bugs within the platform
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='the uuid of the database item'
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bug_reports',
        help_text='The user who reported the bug'
    )

    description = models.TextField(
        help_text="A detailed description of the bug"
    )

    steps_to_reproduce = models.TextField(
        help_text="Steps to reproduce the bug"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    
    recent_window_locations = models.JSONField(
        default=list,
        help_text="List of recent window locations leading up to the bug report"
    )

    app_state = models.JSONField(
        default=dict,
        help_text="Snapshot of the application state at the time of the bug report"
    )
    
    device_info = models.JSONField(
        default=dict,
        help_text="Information about the user's device and environment"
    )
    
    app_version = models.CharField(
        max_length=100,
        help_text="Version of the application"
    )
    
    def recent_dispatches(self):
        """Returns a list of recent redux dispatches leading up to the bug report"""
        return self.app_state.get("logging", {}).get("dispatches", [])
    
    def recent_errors(self):
        """Returns a list of recent redux dispatches leading up to the bug report"""
        return self.app_state.get("logging", {}).get("errors", [])

    def app_state_short(self):
        """Returns a version of appstate sans the info from logging for clarity"""
        app_state_copy = copy.deepcopy(self.app_state)
        if "logging" in app_state_copy:
            del app_state_copy["logging"]
        return app_state_copy

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Bug Report"
        verbose_name_plural = "Bug Reports"

    def __str__(self):
        return f"Bug Report by {self.user.username} at {self.created_at}"

    def to_dict(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "description": self.description,
            "steps_to_reproduce": self.steps_to_reproduce,
            "created_at": self.created_at.isoformat(),
            "recent_errors": self.recent_errors,
            "recent_window_locations": self.recent_window_locations,
            "recent_redux_dispatches": self.recent_redux_dispatches,
            "app_state": self.app_state,
        }