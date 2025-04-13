from django.urls import path
from .views import (
    QuizResponseStatusView, UserRegistrationView, SessionView, CurrentUserView, QuizView,
    LessonView, LessonContentView, TextContentView, WritingView,
    PollView, QuizResponseView, QuizResponseDetailView, GetLessonIds,
<<<<<<< HEAD
    CurriculumView, PollResponseView
=======
    CurriculumView, ResponseView
>>>>>>> 5bbcbcf3c672f65b5d7f6183d19e50c3377448d0
)

urlpatterns = [
    path('users', UserRegistrationView.as_view(), name='user-register'),
    path('users/me', CurrentUserView.as_view(), name='current-user'),
    path('sessions', SessionView.as_view(), name='sessions'),
<<<<<<< HEAD
    path('quizzes/<str:id>', QuizView.as_view(), name='quizes'),
    path('lessons/ids', GetLessonIds.as_view(), name='lesson-ids'),
    path('lessons', CurriculumView.as_view(), name='curriculum'),
    path('quizzes/responses', QuizResponseView.as_view(), name='quiz-responses'),
    path('quizzes/<str:id>/status', QuizResponseStatusView.as_view(), name='quiz-status'),
    path('quizzes/responses/<str:response_id>', QuizResponseDetailView.as_view(), name='quiz-response-detail'),
    path('lessons/<str:id>', LessonView.as_view(), name='lessons'),
    path('lessons/<str:id>/content', LessonContentView.as_view(), name='lesson-content'),
    path('text_content/<str:id>', TextContentView.as_view(), name='text-content'),
    path('writings/<str:id>', WritingView.as_view(), name='writings'),
    path('polls/<str:id>', PollView.as_view(), name='polls'),
    path('poll_responses/', PollResponseView.as_view(), name='poll-response'),
=======
    
    path('lesson/ids', GetLessonIds.as_view(), name='lesson-ids'),
    path('lessons', CurriculumView.as_view(), name='curriculum'),
    path('lesson/<uuid:id>', LessonView.as_view(), name='lessons'),
    path('lesson/<uuid:id>/content', LessonContentView.as_view(), name='lesson-content'),
    
    path('quizzes/<str:id>', QuizView.as_view(), name='quizes'),
    path('quizzes/<str:id>/status', QuizResponseStatusView.as_view(), name='quiz-status'),
    path('quizzes/response', QuizResponseView.as_view(), name='quiz-responses'),
    path('quizzes/response/<uuid:response_id>', QuizResponseDetailView.as_view(), name='quiz-response-detail'),
    path('textcontent/<uuid:id>', TextContentView.as_view(), name='text-content'),
    path('writing/<uuid:id>', WritingView.as_view(), name='writings'),
    path('poll/<uuid:id>', PollView.as_view(), name='polls'),
    
    path('responses/<str:activitytype>', ResponseView.as_view(), name='general-response')
>>>>>>> 5bbcbcf3c672f65b5d7f6183d19e50c3377448d0
]
