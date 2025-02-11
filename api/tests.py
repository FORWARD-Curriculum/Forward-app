from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from core.models import User

class UserRegistrationViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('user-register')
        self.valid_payload = {
            'username': 'testuser',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'date_of_birth': '1990-01-01'
        }

    def test_valid_registration(self):
        """Test registration with valid payload succeeds"""
        response = self.client.post(
            self.register_url,
            self.valid_payload,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, 'testuser')

    def test_password_mismatch(self):
        """Test registration fails when passwords don't match"""
        payload = self.valid_payload.copy()
        payload['password_confirm'] = 'DifferentPass123!'
        
        response = self.client.post(
            self.register_url,
            payload,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 0)

    def test_missing_required_fields(self):
        """Test registration fails when required fields are missing"""
        payload = self.valid_payload.copy()
        del payload['first_name']
        
        response = self.client.post(
            self.register_url,
            payload,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 0)

    def test_duplicate_username(self):
        """Test registration fails with duplicate username"""
        # Create first user
        self.client.post(
            self.register_url,
            self.valid_payload,
            format='json'
        )
        
        # Try to create second user with same username
        response = self.client.post(
            self.register_url,
            self.valid_payload,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 1)