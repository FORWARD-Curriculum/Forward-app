from .response_admin import ReadOnlyAdmin
from core.models import BugReport
from .admin import custom_admin_site
from django.contrib import admin
from django.utils.text import Truncator
from django_json_widget.widgets import JSONEditorWidget
from django.utils.safestring import mark_safe
import json
from django.db import models

@admin.register(BugReport, site=custom_admin_site)
class BugReportAdmin(ReadOnlyAdmin):
    grouping = "Administration"
    list_display = ("id","user__username", "short_description", "app_version", "created_at")
    list_filter = ("app_version", "created_at")
    search_fields = ("user__username", "description", "steps_to_reproduce")
    ordering = ("-created_at",)
    readonly_fields = (
        "id",
        "user",
        "description",
        "steps_to_reproduce",
        "created_at",
        "recent_window_locations",
        "device_info",
        "app_version",
    )
    fieldsets = (
        ("Basic Information", {
            "fields": ("id", "user", "app_version", "created_at"),
        }),
        ("Bug Details", {
            "fields": ("description", "steps_to_reproduce"),
        }),
        ("Technical Details", {
            "classes": ("collapse",),
            "fields": (
                "device_info",
                "recent_window_locations",
                "recent_errors",
                "recent_dispatches",
                "app_state_short",
            ),
        }),
    )
    
    def short_description(self, obj):
        return Truncator(obj.description).chars(60)
    short_description.short_description = "description"
    short_description.admin_order_field = "description"
    
    @property
    def media(self):
        return super().media + JSONEditorWidget().media
    
    def _render_json(self, name: str, data, obj_id: int) -> str:
        """Helper to render JSON data with JSONEditorWidget."""
        widget = JSONEditorWidget(mode="form")
        return mark_safe(widget.render(
            name=f"{name}_{obj_id}",
            value=json.dumps(data),
            attrs={'id': f"{name}_{obj_id}_render", 'style': 'disabled;'}
        ))

    def recent_dispatches(self, obj: BugReport):
        return self._render_json('recent_dispatches', obj.recent_dispatches(), obj.id) + mark_safe(f"""<style> .readonly {{width: 100% !important;display: block;}}</style>""")
    recent_dispatches.short_description = "Recent Redux Dispatches"
    
    def recent_errors(self, obj: BugReport):
        return self._render_json('recent_errors', obj.recent_errors(), obj.id)
    recent_errors.short_description = "Recent Errors"
    
    def app_state_short(self, obj: BugReport):
        return self._render_json('app_state_short', obj.app_state_short(), obj.id)  
    app_state_short.short_description = "App State (Formatted)"
    
    
    formfield_overrides = {
        models.JSONField: {
            "widget": JSONEditorWidget
        }
    }
