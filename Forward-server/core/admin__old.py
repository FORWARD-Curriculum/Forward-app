# admin.py
import json
import base64
from pathlib import Path
from collections import defaultdict

from django import forms
from django.conf import settings
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from django.db import models
from django.urls import reverse
from django.utils.html import format_html
from django.utils.text import slugify, capfirst
from django.utils.safestring import mark_safe
from django.utils.text import Truncator

from django_json_widget.widgets import JSONEditorWidget
from martor.widgets import AdminMartorWidget

from .models import (
    ActivityManager,
    User,
    Lesson,
    TextContent,
    Quiz,
    Question,
    Poll,
    PollQuestion,
    Writing,
    Identification,
    Embed,
    DndMatch,
    ConceptMap,
    Concept,
    Video,
    Twine,
    LikertScale,
    UserQuizResponse,
    UserQuestionResponse,
    VideoResponse,
    DndMatchResponse,
    WritingResponse,
    TextContentResponse,
    TwineResponse,
    PollQuestionResponse,
    IdentificationResponse,
    PollResponse,
    EmbedResponse,
    ConceptMapResponse,
    LikertScaleResponse,
    FillInTheBlank,
    FillInTheBlankResponse,
    Facility,
    BugReport,
)

# ---------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------

JSON_EDITOR_OVERRIDES = {}#{models.JSONField: {"widget": JSONEditorWidget}}