from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import User, Lesson

admin.site.register(User, UserAdmin)
admin.site.register(Lesson)

# @admin.register(Lesson)
# class LessonAdmin(admin.ModelAdmin):
#     # Fields to display in the list view
#     list_display = ('title', 'section_count', 'order', 'created_at', 'updated_at')
    
#     # Fields that can be used for filtering in the sidebar
#     list_filter = ('created_at', 'updated_at')
    
#     # Fields that can be searched
#     search_fields = ('title', 'description')
    
#     # Fields to display in the detail/edit form
#     fieldsets = (
#         ('Basic Information', {
#             'fields': ('title', 'description', 'order')
#         }),
#         ('Learning Objectives & Tags', {
#             'fields': ('objectives', 'tags'),
#             'classes': ('collapse',)  # Makes this section collapsible
#         }),
#     )
    
#     # Make certain fields read-only
#     readonly_fields = ('created_at', 'updated_at')
    
#     # Custom methods for list_display
#     def get_section_count(self, obj):
#         """Display section count with a link to sections"""
#         count = obj.section_count
#         return format_html(f"{count} sections")
#     get_section_count.short_description = "Sections"