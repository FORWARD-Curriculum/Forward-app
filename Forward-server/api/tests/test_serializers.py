from api.tests import setup_django
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIRequestFactory
from api.serializers import UserRegistrationSerializer, UserLoginSerializer, UserUpdateSerializer
from core.models import User


class UserRegistrationSerializerTests(TestCase):
    """Test cases for UserRegistrationSerializer."""
    
    def setUp(self):
        """Set up test data."""
        self.valid_user_data = {
            'username': 'testuser',
            'password': 'TestPassword123!',
            'password_confirm': 'TestPassword123!',
            'display_name': 'Test User',
            'facility': 'rop-dla',
            'consent': False
        }
        
        self.serializer = UserRegistrationSerializer(data=self.valid_user_data)
    
    def test_serializer_with_valid_data(self):
        """Test serializer with valid data."""
        self.assertTrue(self.serializer.is_valid())
    
    def test_serializer_with_missing_required_fields(self):
        """Test serializer with missing required fields."""
        # Missing display_name
        invalid_data = self.valid_user_data.copy()
        del invalid_data['display_name']
        serializer = UserRegistrationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('display_name', serializer.errors)
        
        # Missing username
        invalid_data = self.valid_user_data.copy()
        del invalid_data['username']
        serializer = UserRegistrationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)
        
        # Missing password
        invalid_data = self.valid_user_data.copy()
        del invalid_data['password']
        serializer = UserRegistrationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
    
    def test_serializer_with_password_mismatch(self):
        """Test serializer with password confirmation mismatch."""
        invalid_data = self.valid_user_data.copy()
        invalid_data['password_confirm'] = 'DifferentPassword123!'
        serializer = UserRegistrationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
    
    def test_serializer_with_weak_password(self):
        """Test serializer with weak password."""
        invalid_data = self.valid_user_data.copy()
        invalid_data['password'] = 'password'  # Too common
        invalid_data['password_confirm'] = 'password'
        serializer = UserRegistrationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
    
    def test_create_method(self):
        """Test create method creates user correctly."""
        self.assertTrue(self.serializer.is_valid())
        user = self.serializer.save()
        
        self.assertIsInstance(user, User)
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.display_name, 'Test User')
        self.assertEqual(user.facility_id, 'FAC123')
        self.assertFalse(user.consent)
        
        # Check password was properly hashed
        self.assertTrue(user.check_password('TestPassword123!'))


class UserLoginSerializerTests(TestCase):
    """Test cases for UserLoginSerializer."""
    
    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        self.request = self.factory.get('/')
        
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            password='TestPassword123!',
            display_name='Test User'
        )
        
        self.valid_credentials = {
            'username': 'testuser',
            'password': 'TestPassword123!'
        }
        
        self.invalid_credentials = {
            'username': 'testuser',
            'password': 'WrongPassword123!'
        }
    
    def test_serializer_with_valid_credentials(self):
        """Test serializer with valid credentials."""
        serializer = UserLoginSerializer(
            data=self.valid_credentials,
            context={'request': self.request}
        )
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['user'], self.user)
    
    def test_serializer_with_invalid_credentials(self):
        """Test serializer with invalid credentials."""
        serializer = UserLoginSerializer(
            data=self.invalid_credentials,
            context={'request': self.request}
        )
        with self.assertRaises(AuthenticationFailed):
            serializer.is_valid()
    
    def test_serializer_with_missing_fields(self):
        """Test serializer with missing fields."""
        # Missing username
        invalid_data = {'password': 'TestPassword123!'}
        serializer = UserLoginSerializer(
            data=invalid_data,
            context={'request': self.request}
        )
        self.assertFalse(serializer.is_valid())
        
        # Missing password
        invalid_data = {'username': 'testuser'}
        serializer = UserLoginSerializer(
            data=invalid_data,
            context={'request': self.request}
        )
        self.assertFalse(serializer.is_valid())


class UserUpdateSerializerTests(TestCase):
    """Test cases for UserUpdateSerializer."""
    
    def setUp(self):
        """Set up test data."""
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            password='TestPassword123!',
            display_name='Test User',
            profile_picture=None,
            consent=False
        )
        
        self.valid_update_data = {
            'display_name': 'Updated User',
            'profile_picture': 'avatar.jpg',
            'consent': True
        }
        
        self.partial_update_data = {
            'display_name': 'Partially Updated User'
        }
    
    def test_serializer_with_valid_data(self):
        """Test serializer validation with valid data."""
        serializer = UserUpdateSerializer(data=self.valid_update_data)
        self.assertTrue(serializer.is_valid())
    
    def test_update_method_full_update(self):
        """Test update method with all fields."""
        serializer = UserUpdateSerializer(
            instance=self.user,
            data=self.valid_update_data
        )
        self.assertTrue(serializer.is_valid())
        updated_user = serializer.save()
        
        # Check that user was updated correctly
        self.assertEqual(updated_user.display_name, 'Updated User')
        self.assertEqual(updated_user.profile_picture, 'avatar.jpg')
        self.assertTrue(updated_user.consent)
        
        # Verify the instance in the database was updated
        db_user = User.objects.get(id=self.user.id)
        self.assertEqual(db_user.display_name, 'Updated User')
        self.assertEqual(db_user.profile_picture, 'avatar.jpg')
        self.assertTrue(db_user.consent)
    
    def test_update_method_partial_update(self):
        """Test update method with partial data."""
        serializer = UserUpdateSerializer(
            instance=self.user,
            data=self.partial_update_data,
            partial=True
        )
        self.assertTrue(serializer.is_valid())
        updated_user = serializer.save()
        
        # Check that only specified fields were updated
        self.assertEqual(updated_user.display_name, 'Partially Updated User')
        self.assertIsNone(updated_user.profile_picture)  # Should remain None
        self.assertFalse(updated_user.consent)  # Should remain False