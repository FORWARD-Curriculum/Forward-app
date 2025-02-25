from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Lesson, Quiz, Question, Poll, PollQuestion, TextContent

admin.site.register(User, UserAdmin)
admin.site.register(Lesson)
admin.site.register(TextContent)
admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(Poll)
admin.site.register(PollQuestion)