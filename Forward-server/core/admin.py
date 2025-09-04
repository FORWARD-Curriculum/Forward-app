import json
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.conf import settings
from django import forms
from django.core.files.storage import default_storage
from pathlib import Path
from django.db.models import JSONField, TextField, CharField
from django_json_widget.widgets import JSONEditorWidget
from martor.widgets import AdminMartorWidget

# Import all models from your existing models.py
from .models import (
    User, Lesson, TextContent, Quiz, Question, Poll, PollQuestion, Writing,
    Identification, Embed, DndMatch, ConceptMap, Concept, Video, Twine,
    LikertScale, UserQuizResponse, UserQuestionResponse, VideoResponse,
    DndMatchResponse, WritingResponse, TextContentResponse, TwineResponse,
    PollQuestionResponse, IdentificationResponse, PollResponse, EmbedResponse,
    ConceptMapResponse, LikertScaleResponse
)

# --- NEW: Custom Form for TextContent ---
class TextContentAdminForm(forms.ModelForm):
    image_upload = forms.FileField(
        required=False,
        help_text="Upload a new image to replace the existing one. This will be saved to your S3 bucket."
    )

    class Meta:
        model = TextContent
        fields = '__all__'

    def save(self, commit=True):
        if self.cleaned_data.get('image_upload'):
            uploaded_file = self.cleaned_data['image_upload']
            key_prefix = "text_content_image/"
            file_key = f"public/{key_prefix}{Path(uploaded_file.name).name}"

            if default_storage.exists(file_key):
                default_storage.delete(file_key)
            
            saved_path = default_storage.save(file_key, uploaded_file)
            self.instance.image = saved_path

        return super().save(commit=commit)

# --- FIX: Custom Widget and Field for Multiple File Uploads ---
class MultipleFileInput(forms.ClearableFileInput):
    """
    A custom widget that allows for the selection of multiple files.
    """
    allow_multiple_selected = True

class MultipleFileField(forms.FileField):
    """
    A custom form field that uses the MultipleFileInput widget and can clean
    a list of uploaded files.
    """
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget", MultipleFileInput())
        super().__init__(*args, **kwargs)

    def clean(self, data, initial=None):
        single_file_clean = super().clean
        if isinstance(data, (list, tuple)):
            return [single_file_clean(d, initial) for d in data]
        else:
            return [single_file_clean(data, initial)]

class TwineAdminForm(forms.ModelForm):
    # Use the new MultipleFileField for image uploads
    images_upload = MultipleFileField(
        required=False,
        help_text=(
            "Upload all referenced images for the Twine file. This will be "
            "saved to the S3 bucket."
        ),
    )

    file_upload = forms.FileField(
        required=False, # Make this optional to allow creating an empty object first
        help_text=(
            "Upload a new Twine file. This will be saved to the S3 bucket."
        ),
    )

    class Meta:
        model = Twine
        exclude = ("file",)

    def save(self, commit=True):
        # This save logic correctly handles a list of files, so no changes are needed here.
        uploaded_images = self.cleaned_data.get("images_upload")
        if uploaded_images:
            for uploaded_file in uploaded_images:
                key_prefix = "twine/"
                file_key = (
                    f"public/{key_prefix}{Path(uploaded_file.name).name}"
                )

                if default_storage.exists(file_key):
                    default_storage.delete(file_key)

                default_storage.save(file_key, uploaded_file)

        uploaded_file = self.cleaned_data.get("file_upload")
        if uploaded_file:
            # Ensure the file pointer is at the beginning
            uploaded_file.seek(0)
            file_content = uploaded_file.read().decode("utf-8")
            self.instance.file = file_content

        return super().save(commit=commit)

# --- User Admin Customization ---
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'display_name', 'email', 'is_staff', 'is_superuser')
    list_filter = ('is_staff', 'is_superuser', 'groups')
    search_fields = ('username', 'display_name', 'email')
    ordering = ('username',)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (('Personal info'), {'fields': ('display_name', 'facility', 'profile_picture')}),
        (('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'consent',
                                       'groups', 'user_permissions')}),
        (('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("username", "display_name", "email", "password", "password2"),
            },
        ),
    )

# --- Base Admin for Activities ---
class BaseActivityAdmin(admin.ModelAdmin):
    list_display = ('title', 'lesson', 'order', 'updated_at')
    list_filter = ('lesson',)
    search_fields = ('title', 'instructions')
    ordering = ('lesson', 'order')
    list_editable = ('order',)

# --- Inlines for Parent-Child Models ---
class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    ordering = ('order',)
    fields = ('order', 'question_text', 'question_type', 'choices', 'is_required', 'feedback_config')

class PollQuestionInline(admin.TabularInline):
    model = PollQuestion
    extra = 1
    ordering = ('order',)
    fields = ('order', 'question_text', 'options', 'allow_multiple')

class ConceptInline(admin.StackedInline):
    model = Concept
    # summernote_fields = ('description',)
    extra = 1
    ordering = ('order',)
    formfield_overrides = {
        JSONField: {'widget': JSONEditorWidget},
        TextField: {'widget': AdminMartorWidget},
    }
    fields = ('order', 'title', 'description', 'image', 'examples')

# --- Activity Model Admins ---
@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'created_at', 'updated_at')
    search_fields = ('title', 'description')
    ordering = ('order',)
    list_editable = ('order',)

@admin.register(Quiz)
class QuizAdmin(BaseActivityAdmin):
    inlines = [QuestionInline]
    list_display = ('title', 'lesson', 'order', 'passing_score')

@admin.register(Poll)
class PollAdmin(BaseActivityAdmin):
    inlines = [PollQuestionInline]

@admin.register(ConceptMap)
class ConceptMapAdmin(BaseActivityAdmin):
    # summernote_fields = ('content')
    inlines = [ConceptInline]
    formfield_overrides = {
        TextField: {'widget': AdminMartorWidget},   
    }

def get_public_media_url(s3_key):
    if not s3_key:
        return None
    try:
        endpoint_url = getattr(settings, 'AWS_S3_ENDPOINT_URL', 'http://localhost:9000')
        bucket_name = settings.STORAGES['default']['OPTIONS']['bucket_name']
        return f"{endpoint_url}/{bucket_name}/{s3_key}"
    except (AttributeError, KeyError):
        return f"/media/{s3_key}"

@admin.register(TextContent)
class TextContentAdmin(BaseActivityAdmin):
    form = TextContentAdminForm
    fields = ('lesson', 'order', 'title', 'instructions', 'content', 'image_upload', 'image_preview')
    readonly_fields = ('image_preview',)

    def image_preview(self, obj):
        url = get_public_media_url(obj.image)
        if url:
            return format_html('<img src="{}" style="max-height: 150px; max-width: 300px;" />', url)
        return "No Image"
    image_preview.short_description = 'Image Preview'

@admin.register(Video)
class VideoAdmin(BaseActivityAdmin):
    readonly_fields = ('video_preview',)
    def video_preview(self, obj):
        url = get_public_media_url(obj.video)
        if url:
            return format_html('<video width="320" height="240" controls><source src="{}" type="video/mp4">Your browser does not support the video tag.</video>', url)
        return "No Video"
    video_preview.short_description = 'Video Preview'

@admin.register(Twine)
class TwineAdmin(BaseActivityAdmin):
    form = TwineAdminForm
    list_display = ('title', 'lesson', 'order', 'file_snippet')
    def file_snippet(self, obj):
        return obj.file[:100] + '...' if obj.file else 'No content'
    file_snippet.short_description = 'File Content Snippet'

class JsonAdminMixin:
    def formated_json_field(self, obj, field_name):
        json_data = getattr(obj, field_name, None)
        if json_data:
            pretty_json = json.dumps(json_data, indent=2)
            return format_html('<pre style="white-space: pre-wrap; word-break: break-all;">{}</pre>', pretty_json)
        return "Empty"
    def display_content_as_json(self, obj):
        return self.formated_json_field(obj, 'content')
    display_content_as_json.short_description = 'Content (Formatted)'
    def display_prompts_as_json(self, obj):
        return self.formated_json_field(obj, 'prompts')
    display_prompts_as_json.short_description = 'Prompts (Formatted)'

@admin.register(Writing)
class WritingAdmin(BaseActivityAdmin, JsonAdminMixin):
    readonly_fields = ('display_prompts_as_json',)
    fields = ('lesson', 'order', 'title', 'instructions', 'prompts', 'display_prompts_as_json')

@admin.register(DndMatch)
class DndMatchAdmin(BaseActivityAdmin, JsonAdminMixin):
    readonly_fields = ('display_content_as_json',)
    fields = ('lesson', 'order', 'title', 'instructions', 'content', 'display_content_as_json')
    formfield_overrides = {
        JSONField: {'widget': JSONEditorWidget},
    }

@admin.register(LikertScale)
class LikertScaleAdmin(BaseActivityAdmin, JsonAdminMixin):
    readonly_fields = ('display_content_as_json',)
    fields = ('lesson', 'order', 'title', 'instructions', 'content', 'display_content_as_json')
    formfield_overrides = {
        JSONField: {'widget': JSONEditorWidget},
    }

class IdenificationAdmin(admin.ModelAdmin):
    # summernote_fields = ('content')
    formfield_overrides = {
        TextField: {'widget': AdminMartorWidget},  
                CharField: {'widget': AdminMartorWidget},
    }

admin.site.register(Identification, IdenificationAdmin)

admin.site.register(Embed, BaseActivityAdmin)

class ReadOnlyAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        return False
    def has_delete_permission(self, request, obj=None):
        return False
    def get_actions(self, request):
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions

@admin.register(UserQuizResponse)
class UserQuizResponseAdmin(ReadOnlyAdmin):
    list_display = ('user', 'associated_activity', 'lesson', 'score', 'partial_response', 'updated_at')
    list_filter = ('lesson', 'associated_activity', 'user')

@admin.register(UserQuestionResponse)
class UserQuestionResponseAdmin(ReadOnlyAdmin):
    list_display = ('user', 'question', 'quiz_response', 'is_correct', 'updated_at')
    list_filter = ('question__quiz', 'user')

response_models = [
    VideoResponse, DndMatchResponse, WritingResponse, TextContentResponse,
    TwineResponse, PollQuestionResponse, IdentificationResponse, PollResponse,
    EmbedResponse, ConceptMapResponse, LikertScaleResponse
]
for model in response_models:
    admin_class = type(
        f'{model.__name__}Admin',
        (ReadOnlyAdmin,),
        {'list_display': ('user', 'associated_activity', 'lesson', 'partial_response', 'updated_at'), 'list_filter': ('lesson', 'user'),}
    )
    admin.site.register(model, admin_class)