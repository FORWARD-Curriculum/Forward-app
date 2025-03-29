from django.urls import path
from .views import (
    QuizResponseStatusView, UserRegistrationView, SessionView, CurrentUserView, QuizView,
    LessonView, LessonContentView, TextContentView, WritingView,
    PollView, QuizResponseView, QuizResponseDetailView, GetLessonIds,
    CurriculumView
)

urlpatterns = [
    path('users', UserRegistrationView.as_view(), name='user-register'),
    path('users/me', CurrentUserView.as_view(), name='current-user'),
    path('sessions', SessionView.as_view(), name='sessions'),
    path('quizzes/<int:id>', QuizView.as_view(), name='quizes'),
    path('lessons/ids', GetLessonIds.as_view(), name='lesson-ids'),
    path('lessons', CurriculumView.as_view(), name='curriculum'),
    path('quizzes/responses', QuizResponseView.as_view(), name='quiz-responses'),
    path('quizzes/<int:id>/status', QuizResponseStatusView.as_view(), name='quiz-status'),
    path('quizzes/responses/<int:response_id>', QuizResponseDetailView.as_view(), name='quiz-response-detail'),
    path('lessons/<int:id>', LessonView.as_view(), name='lessons'),
    path('lessons/<int:id>/content', LessonContentView.as_view(), name='lesson-content'),
    path('text_content/<int:id>', TextContentView.as_view(), name='text-content'),
    path('writings/<int:id>', WritingView.as_view(), name='writings'),
    path('polls/<int:id>', PollView.as_view(), name='polls'),
]
