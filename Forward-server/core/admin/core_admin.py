from django.contrib.auth.admin import UserAdmin
from core.models import User, Facility
from django.contrib import admin
from .admin import custom_admin_site
from django.utils.html import format_html
from django.urls import reverse

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
                "fields": ("username", "display_name","password", "password2", "facility"),
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
