from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Lesson, Quiz, Question, Poll, PollQuestion, TextContent

admin.site.register(Lesson)
admin.site.register(TextContent)
admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(Poll)
admin.site.register(PollQuestion)

# Custom admin panel view to support our custom user model
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Define fieldsets for user admin detail view
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('display_name', 'facility', 'profile_picture')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'consent',
                                       'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined', 'surveyed_at')}),
    )
    
    # Define fields for add user form
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'display_name', 'password1', 'password2'),
        }),
    )
    
    # Define which fields to display in the user list
    list_display = ('username', 'display_name', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'display_name')
    ordering = ('username',)