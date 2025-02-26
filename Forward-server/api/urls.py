from django.urls import path
from .views import UserRegistrationView, SessionView, CurrentUserView

urlpatterns = [
    path('users/', UserRegistrationView.as_view(), name='user-register'),
    path('users/me/', CurrentUserView.as_view(), name='current-user'),
    path('sessions/', SessionView.as_view(), name='sessions'),
]
