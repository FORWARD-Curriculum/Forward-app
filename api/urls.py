from django.urls import path
from .views import UserRegistrationView, UserLoginView

urlpatterns = [
    path('users/', UserRegistrationView.as_view(), name='user-register'),
    path('sessions/', UserLoginView.as_view(), name='user-login'),
]
