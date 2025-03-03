from django.urls import path
from .views import UserRegistrationView, SessionView, CurrentUserView, QuizView, LessonView, TextContentView, WritingView, PollView

urlpatterns = [
    path('users/', UserRegistrationView.as_view(), name='user-register'),
    path('users/me/', CurrentUserView.as_view(), name='current-user'),
    path('sessions/', SessionView.as_view(), name='sessions'),
    path('quizzes/<int:id>', QuizView.as_view(), name='quizes'),
    path('lessons/<int:id>', LessonView.as_view(), name='lessons'),
    path('text_content/<int:id>', TextContentView.as_view(), name='text-content'),
    path('writings/<int:id>', WritingView.as_view(), name='writings'),
    path('polls/<int:id>', PollView.as_view(), name='polls'),
]
