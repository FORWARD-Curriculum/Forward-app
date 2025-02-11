from django.urls import path
from .views import UserRegistrationView

urlpatterns = [
    path('users/', UserRegistrationView.as_view(), name='user-register'),
]
