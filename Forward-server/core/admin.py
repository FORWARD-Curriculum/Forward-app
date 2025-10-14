# admin.py
import json
from pathlib import Path
from collections import defaultdict

from django import forms
from django.conf import settings
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.core.files.storage import default_storage
from django.db import models
from django.urls import reverse
from django.utils.html import format_html
from django.utils.text import slugify

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
)

# ---------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------


def storage_url(s3_key: str | None) -> str | None:
    """
    Prefer default_storage.url to build a public/pre-signed URL if supported.
    Fallback to manual S3/MinIO path or local media URL.
    """
    if not s3_key:
        return None
    try:
        return default_storage.url(s3_key)
    except Exception:
        # Fallback: build manually
        endpoint_url = getattr(settings, "AWS_S3_ENDPOINT_URL", "")
        try:
            bucket_name = settings.STORAGES["default"]["OPTIONS"]["bucket_name"]
        except Exception:
            bucket_name = ""
        if endpoint_url and bucket_name:
            return f"{endpoint_url}/{bucket_name}/{s3_key}"
        return f"/media/{s3_key}"


def save_file(uploaded_file, key_prefix: str) -> str:
    """
    Save a file to default storage under public/{key_prefix}{filename}.
    Replaces any existing file with the same key.
    Returns the saved storage key.
    """
    file_key = f"public/{key_prefix}{Path(uploaded_file.name).name}"
    if default_storage.exists(file_key):
        default_storage.delete(file_key)
    return default_storage.save(file_key, uploaded_file)


JSON_EDITOR_OVERRIDES = {models.JSONField: {"widget": JSONEditorWidget}}

# ---------------------------------------------------------------------
# Custom Admin Site with grouping
# ---------------------------------------------------------------------


class CustomAdminSite(admin.AdminSite):
    site_header = "FORWARD Administration"
    site_title = "FORWARD Admin Panel"
    index_title = "Welcome to the FORWARD Admin site"

    def get_app_list(self, request, app_label=None):
        app_dict = self._build_app_dict(request)
        default_group_name = "Uncategorized"

        grouped_apps = defaultdict(
            lambda: {"name": "", "app_label": "", "models": []}
        )

        for _, app_info in app_dict.items():
            for model_info in app_info["models"]:
                model_admin = self._registry.get(model_info["model"])
                group_name = getattr(
                    model_admin, "grouping", app_info.get("name", default_group_name)
                )
                if not grouped_apps[group_name]["name"]:
                    grouped_apps[group_name]["name"] = group_name
                    grouped_apps[group_name]["app_label"] = slugify(group_name)
                grouped_apps[group_name]["models"].append(model_info)

        group_order = {"Core": 0, "Curriculum": 1, "Activities": 2, "Responses": 3}

        app_list = sorted(
            grouped_apps.values(),
            key=lambda x: (group_order.get(x["name"], len(group_order)), x["name"]),
        )
        for app in app_list:
            app["models"].sort(key=lambda x: x["name"])
        return app_list


custom_admin_site = CustomAdminSite(name="custom_admin")

# ---------------------------------------------------------------------
# Forms
# ---------------------------------------------------------------------


class TextContentAdminForm(forms.ModelForm):
    image_upload = forms.FileField(
        required=False,
        help_text=(
            "Upload a new image to replace the existing one. "
            "This will be saved to your S3 bucket."
        ),
    )

    class Meta:
        model = TextContent
        fields = "__all__"

    def save(self, commit=True):
        uploaded = self.cleaned_data.get("image_upload")
        if uploaded:
            self.instance.image = save_file(uploaded, "text_content_image/")
        return super().save(commit=commit)


class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultipleFileField(forms.FileField):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget", MultipleFileInput())
        super().__init__(*args, **kwargs)

    def clean(self, data, initial=None):
        if not data:
            return []
        single_clean = super().clean
        if isinstance(data, (list, tuple)):
            return [single_clean(d, initial) for d in data]
        return [single_clean(data, initial)]


class TwineAdminForm(forms.ModelForm):
    images_upload = MultipleFileField(
        required=False,
        help_text=(
            "Upload all referenced images for the Twine file. "
            "They will be saved to the S3 bucket."
        ),
    )
    file_upload = forms.FileField(
        required=False,
        help_text=("Upload a new Twine file. This will be saved to the S3 bucket."),
    )

    class Meta:
        model = Twine
        exclude = ("file",)

    def save(self, commit=True):
        uploaded_images = self.cleaned_data.get("images_upload")
        if uploaded_images:
            for uf in uploaded_images:
                save_file(uf, "twine/")

        uploaded_file = self.cleaned_data.get("file_upload")
        if uploaded_file:
            uploaded_file.seek(0)
            self.instance.file = uploaded_file.read().decode("utf-8")
        return super().save(commit=commit)


# ---------------------------------------------------------------------
# Shared Admin Pieces
# ---------------------------------------------------------------------


class BaseActivityAdmin(admin.ModelAdmin):
    list_display = ("title", "lesson", "order", "updated_at")
    list_filter = ("lesson",)
    search_fields = ("title", "instructions")
    ordering = ("lesson", "order")
    list_editable = ("order",)


class JsonAdminMixin:
    def formatted_json_field(self, obj, field_name):
        data = getattr(obj, field_name, None)
        if data:
            pretty = json.dumps(data, indent=2)
            return format_html(
                '<pre style="white-space: pre-wrap; word-break: break-all;">{}</pre>',
                pretty,
            )
        return "Empty"

    def display_content_as_json(self, obj):
        return self.formatted_json_field(obj, "content")

    display_content_as_json.short_description = "Content (Formatted)"

    def display_prompts_as_json(self, obj):
        return self.formatted_json_field(obj, "prompts")

    display_prompts_as_json.short_description = "Prompts (Formatted)"


class ReadOnlyAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_actions(self, request):
        actions = super().get_actions(request)
        actions.pop("delete_selected", None)
        return actions


# ---------------------------------------------------------------------
# User / Facility Admin with facility scoping for Instructors
# ---------------------------------------------------------------------


@admin.register(User, site=custom_admin_site)
class CustomUserAdmin(UserAdmin):
    grouping = "Core"
    list_display = ("display_name", "username", "facility_name", "is_staff", "is_superuser")
    list_filter = ("is_staff", "is_superuser", "groups")
    search_fields = ("username", "display_name", "email")
    ordering = ("username",)
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (("Personal info"), {"fields": ("display_name", "facility", "profile_picture")}),
        (
            ("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "consent",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (("Important dates"), {"fields": ("last_login", "date_joined", "surveyed_at")}),
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

    def facility_name(self, obj):
        return obj.facility.name if obj.facility else "-"
    facility_name.short_description = "Facility"
    facility_name.admin_order_field = "facility__name"

    def _is_instructor(self, request):
        return request.user.groups.filter(name="Instructors").exists()

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if self._is_instructor(request) and request.user.facility_id:
            return qs.filter(facility_id=request.user.facility_id)
        return qs.none()

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if request.user.is_superuser:
            return fieldsets

        new_fieldsets = []
        for name, opts in fieldsets:
            if name == "Permissions":
                fields = [
                    f
                    for f in opts["fields"]
                    if f not in ("is_staff", "is_superuser", "user_permissions", "groups")
                ]
                new_fieldsets.append((name, {"fields": fields}))
            else:
                new_fieldsets.append((name, opts))
        return tuple(new_fieldsets)

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser and not obj.facility_id:
            if self._is_instructor(request):
                obj.facility_id = request.user.facility_id
        super().save_model(request, obj, form, change)

    def has_module_permission(self, request):
        return request.user.is_superuser or self._is_instructor(request)

    def has_view_permission(self, request, obj=None):
        if not self.has_module_permission(request):
            return False
        if request.user.is_superuser or obj is None:
            return True
        return obj.facility_id == request.user.facility_id

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj and self._is_instructor(request):
            return obj.facility_id == request.user.facility_id
        return False

    def has_add_permission(self, request):
        return self.has_module_permission(request)

    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj and self._is_instructor(request):
            return obj.facility_id == request.user.facility_id and obj != request.user
        return False


class UserInline(admin.TabularInline):
    model = User
    fields = ("username", "display_name", "surveyed_at", "password_reset_link")
    readonly_fields = ("password_reset_link",)
    extra = 0
    show_change_link = True

    def password_reset_link(self, obj):
        if obj.pk:
            app_label = obj._meta.app_label
            url = reverse(f"custom_admin:{app_label}_user_change", args=(obj.pk,))
            return format_html('<a href="{}">Reset Password</a>', url)
        return "N/A (save facility first)"

    password_reset_link.short_description = "Password"

    def _is_instructor(self, request):
        return request.user.groups.filter(name="Instructors").exists()

    def has_view_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if self._is_instructor(request):
            return obj is None or obj.pk == getattr(request.user, "facility_id", None)
        return False

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if self._is_instructor(request):
            return obj is None or obj.pk == getattr(request.user, "facility_id", None)
        return False

    def has_add_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if self._is_instructor(request):
            return obj is not None and obj.pk == getattr(request.user, "facility_id", None)
        return False

    def has_delete_permission(self, request, obj=None):
        # Safer to disable deletes from inline for instructors
        return request.user.is_superuser


@admin.register(Facility, site=custom_admin_site)
class FacilityAdmin(admin.ModelAdmin):
    grouping = "Core"
    list_display = ("name", "code", "user_count")
    search_fields = ("name", "code")
    inlines = [UserInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request).prefetch_related("user_set")
        if request.user.is_superuser:
            return qs
        if request.user.groups.filter(name="Instructors").exists():
            return qs.filter(pk=request.user.facility_id)
        return qs.none()

    def user_count(self, obj):
        return obj.user_set.count()

    user_count.short_description = "Associated Users"

    def has_module_permission(self, request):
        return request.user.is_superuser or request.user.groups.filter(
            name="Instructors"
        ).exists()

    def has_view_permission(self, request, obj=None):
        return self.has_module_permission(request)

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj and request.user.groups.filter(name="Instructors").exists():
            return obj.pk == request.user.facility_id
        return False

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


# ---------------------------------------------------------------------
# Inlines for Activity Children
# ---------------------------------------------------------------------


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    ordering = ("order",)
    fields = (
        "order",
        "question_text",
        "question_type",
        "choices",
        "is_required",
        "feedback_config",
    )


class PollQuestionInline(admin.TabularInline):
    model = PollQuestion
    extra = 1
    ordering = ("order",)
    fields = ("order", "question_text", "options", "allow_multiple")


class ConceptInline(admin.StackedInline):
    model = Concept
    extra = 1
    ordering = ("order",)
    formfield_overrides = {
        **JSON_EDITOR_OVERRIDES,
        models.TextField: {"widget": AdminMartorWidget},
    }
    fields = ("order", "title", "description", "image", "examples")


# ---------------------------------------------------------------------
# Curriculum
# ---------------------------------------------------------------------


@admin.register(Lesson, site=custom_admin_site)
class LessonAdmin(admin.ModelAdmin):
    grouping = "Curriculum"
    list_display = ("title", "order", "created_at", "updated_at")
    search_fields = ("title", "description")
    ordering = ("order",)
    list_editable = ("order",)


# ---------------------------------------------------------------------
# Activities
# ---------------------------------------------------------------------


@admin.register(Quiz, site=custom_admin_site)
class QuizAdmin(BaseActivityAdmin):
    grouping = "Activities"
    inlines = [QuestionInline]
    list_display = ("title", "lesson", "order", "passing_score")


@admin.register(Poll, site=custom_admin_site)
class PollAdmin(BaseActivityAdmin):
    grouping = "Activities"
    inlines = [PollQuestionInline]


@admin.register(ConceptMap, site=custom_admin_site)
class ConceptMapAdmin(BaseActivityAdmin):
    grouping = "Activities"
    inlines = [ConceptInline]
    formfield_overrides = {models.TextField: {"widget": AdminMartorWidget}}


def _image_tag(url: str | None, max_h=150, max_w=300):
    if not url:
        return "No Image"
    return format_html(
        '<img src="{}" style="max-height: {}px; max-width: {}px;" />',
        url,
        max_h,
        max_w,
    )


def _video_tag(url: str | None, width=320, height=240):
    if not url:
        return "No Video"
    return format_html(
        '<video width="{}" height="{}" controls>'
        '<source src="{}" type="video/mp4">'
        "Your browser does not support the video tag.</video>",
        width,
        height,
        url,
    )


@admin.register(TextContent, site=custom_admin_site)
class TextContentAdmin(BaseActivityAdmin):
    grouping = "Activities"
    form = TextContentAdminForm
    fields = (
        "lesson",
        "order",
        "title",
        "instructions",
        "content",
        "image_upload",
        "image_preview",
    )
    readonly_fields = ("image_preview",)

    def image_preview(self, obj):
        return _image_tag(storage_url(obj.image))

    image_preview.short_description = "Image Preview"


@admin.register(Video, site=custom_admin_site)
class VideoAdmin(BaseActivityAdmin):
    grouping = "Activities"
    readonly_fields = ("video_preview",)

    def video_preview(self, obj):
        return _video_tag(storage_url(obj.video))

    video_preview.short_description = "Video Preview"


@admin.register(Twine, site=custom_admin_site)
class TwineAdmin(BaseActivityAdmin):
    grouping = "Activities"
    form = TwineAdminForm
    list_display = ("title", "lesson", "order", "file_snippet")

    def file_snippet(self, obj):
        return obj.file[:100] + "..." if obj.file else "No content"

    file_snippet.short_description = "File Content Snippet"


@admin.register(Writing, site=custom_admin_site)
class WritingAdmin(BaseActivityAdmin, JsonAdminMixin):
    grouping = "Activities"
    readonly_fields = ("display_prompts_as_json",)
    fields = (
        "lesson",
        "order",
        "title",
        "instructions",
        "prompts",
        "display_prompts_as_json",
    )


@admin.register(DndMatch, site=custom_admin_site)
class DndMatchAdmin(BaseActivityAdmin, JsonAdminMixin):
    grouping = "Activities"
    readonly_fields = ("display_content_as_json",)
    fields = ("lesson", "order", "title", "instructions", "content", "display_content_as_json")
    formfield_overrides = {**JSON_EDITOR_OVERRIDES}


@admin.register(FillInTheBlank, site=custom_admin_site)
class FillInTheBlankAdmin(BaseActivityAdmin, JsonAdminMixin):
    grouping = "Activities"
    readonly_fields = ("display_content_as_json",)
    fields = ("lesson", "order", "title", "instructions", "content", "display_content_as_json")
    formfield_overrides = {**JSON_EDITOR_OVERRIDES}


@admin.register(LikertScale, site=custom_admin_site)
class LikertScaleAdmin(BaseActivityAdmin, JsonAdminMixin):
    grouping = "Activities"
    readonly_fields = ("display_content_as_json",)
    fields = ("lesson", "order", "title", "instructions", "content", "display_content_as_json")
    formfield_overrides = {**JSON_EDITOR_OVERRIDES}


@admin.register(Identification, site=custom_admin_site)
class IdentificationAdmin(BaseActivityAdmin):
    grouping = "Activities"
    formfield_overrides = {
        models.TextField: {"widget": AdminMartorWidget},
        models.CharField: {"widget": AdminMartorWidget},
    }


custom_admin_site.register(Embed, BaseActivityAdmin, grouping="Activities")

# ---------------------------------------------------------------------
# Responses - Read-only
# ---------------------------------------------------------------------


@admin.register(FillInTheBlankResponse, site=custom_admin_site)
class FillInTheBlankResponseAdmin(ReadOnlyAdmin):
    grouping = "Responses"
    list_display = (
        "user",
        "associated_activity",
        "lesson",
        "partial_response",
        "updated_at",
        "submission",
    )
    list_filter = ("lesson", "user")


@admin.register(UserQuizResponse, site=custom_admin_site)
class UserQuizResponseAdmin(ReadOnlyAdmin):
    grouping = "Responses"
    list_display = (
        "user",
        "associated_activity",
        "lesson",
        "score",
        "partial_response",
        "updated_at",
    )
    list_filter = ("lesson", "associated_activity", "user")


@admin.register(UserQuestionResponse, site=custom_admin_site)
class UserQuestionResponseAdmin(ReadOnlyAdmin):
    grouping = "Responses"
    list_display = ("user", "question", "quiz_response", "is_correct", "updated_at")
    list_filter = ("question__quiz", "user")

@admin.register(WritingResponse, site=custom_admin_site)
class WritingResponseAdmin(ReadOnlyAdmin):
    grouping = "Responses"
    list_display = ("user", "associated_activity", "lesson", "updated_at")
    list_filter = ("lesson", "user")
    
    readonly_fields = ("display_prompt_and_responses",)
    fields = ("user", "associated_activity", "lesson", "display_prompt_and_responses", "updated_at")
    
    def display_prompt_and_responses(self, obj):   
        responses = obj.responses
        prompts = obj.associated_activity.prompts
        pairs = []
        for index, prompt in enumerate(prompts):
            if index < len(responses):
                pairs.append([prompt, responses[index]])
            else:
                pairs.append([prompt],"No response")
            
        html = []
        for prompt, response in pairs:
            html.append(
            format_html(
                '<div style="margin-bottom: 20px;">'
                    '<div style="margin-bottom: 10px;"><strong>{}</strong></div>'
                    '<div style="white-space: pre-wrap; font-family: monospace; margin-left: 25px;">{}</div>'
                '</div>',
                prompt,
                response
            )
            )
        return format_html(''.join(html)) 
    display_prompt_and_responses.short_description = "Prompts and Responses"


# Auto-register the rest of response models via ActivityManager (DRY)
EXCLUDE_RESPONSES = {UserQuizResponse, UserQuestionResponse, FillInTheBlankResponse}
for _, (ActivityClass, ResponseClass, _, _child, _) in ActivityManager().registered_activities.items():
    if not ResponseClass or ResponseClass in EXCLUDE_RESPONSES:
        continue

    # Compute generic list_display
    model_fields = {f.name for f in ResponseClass._meta.get_fields()}
    extras = []
    for name in ("submission", "response", "content", "watched_percentage"):
        if name in model_fields:
            extras.append(name)

    admin_cls = type(
        f"{ResponseClass.__name__}Admin",
        (ReadOnlyAdmin,),
        {
            "grouping": "Responses",
            "list_display": tuple(
                ["user", "associated_activity", "lesson", "partial_response", "updated_at", *extras]
            ),
            "list_filter": ("lesson", "user"),
            "formfield_overrides": {**JSON_EDITOR_OVERRIDES}
        },
    )
    try:
        custom_admin_site.register(ResponseClass, admin_cls)
    except admin.sites.AlreadyRegistered:
        pass