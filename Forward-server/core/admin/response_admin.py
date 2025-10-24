from core.models import (FillInTheBlankResponse, UserQuizResponse, UserQuestionResponse, WritingResponse, ActivityManager)
from .admin import custom_admin_site
from django.contrib import admin
from django.utils.html import format_html
from django.db import models
from django_json_widget.widgets import JSONEditorWidget


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
EXCLUDE_RESPONSES = {UserQuizResponse, UserQuestionResponse, FillInTheBlankResponse, WritingResponse}
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
            "formfield_overrides": {models.JSONField: {"widget": JSONEditorWidget}}
        },
    )
    try:
        custom_admin_site.register(ResponseClass, admin_cls)
    except admin.sites.AlreadyRegistered:
        pass