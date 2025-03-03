from django.test import TestCase
from django.core.exceptions import ValidationError
from .services import UserService
from .models import User
from datetime import date

class UserServiceTests(TestCase):
    def setUp(self):
        self.valid_user_data = {
            'username': 'testuser',
            'password': 'StrongPass123!',
            'email': 'test@example.com',
            'display_name': 'Test',
            'facility_id': '2781',
            'profile_picture': '/pfp.png',
            'consent': False
        }

    def test_create_user_success(self):
        """Test successful user creation"""
        user = UserService.create_user(self.valid_user_data)
        
        self.assertIsInstance(user, User)
        self.assertEqual(user.username, self.valid_user_data['username'])
        self.assertEqual(user.email, self.valid_user_data['email'])
        self.assertEqual(user.display_name, self.valid_user_data['display_name'])
        self.assertEqual(user.facility_id, self.valid_user_data['facility_id'])
        self.assertEqual(user.profile_picture, self.valid_user_data['profile_picture'])
        self.assertEqual(user.consent,self.valid_user_data['consent'])
        self.assertTrue(user.check_password(self.valid_user_data['password']))

    def test_create_user_without_optional_fields(self):
        """Test user creation without optional fields"""
        data = {
            'username': 'testuser',
            'password': 'StrongPass123!',
            'display_name': 'Test',
        }
        user = UserService.create_user(data)
        
        self.assertIsInstance(user, User)
        self.assertIsNone(user.email)
        self.assertIsNone(user.date_of_birth)

    def test_create_user_weak_password(self):
        """Test user creation with weak password fails"""
        data = self.valid_user_data.copy()
        data['password'] = 'weak'
        
        with self.assertRaises(ValidationError):
            UserService.create_user(data)

    def test_create_user_missing_required_field(self):
        """Test user creation with missing required field fails"""
        data = self.valid_user_data.copy()
        del data['display_name']
        
        with self.assertRaises(ValidationError):
            UserService.create_user(data)