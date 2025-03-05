from django.test import TestCase, RequestFactory
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.contrib.sessions.middleware import SessionMiddleware
from core.services import UserService
from core.models import User


class UserServiceTests(TestCase):
    """Test cases for UserService."""
    
    def setUp(self):
        """Set up test data."""
        self.factory = RequestFactory()
        self.request = self.factory.get('/')
        
        # Add session to request
        middleware = SessionMiddleware(lambda req: None)
        middleware.process_request(self.request)
        self.request.session.save()
        
        # Create a test user
        self.user = User.objects.create_user(
            username='existinguser',
            password='ExistingPassword123!',
            display_name='Existing User'
        )
        
        # Valid user data for tests
        self.valid_user_data = {
            'username': 'testuser',
            'password': 'TestPassword123!',
            'display_name': 'Test User'
        }
    
    def test_create_user_with_valid_data(self):
        """Test creating a user with valid data."""
        user = UserService.create_user(self.valid_user_data)
        
        self.assertIsInstance(user, User)
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.display_name, 'Test User')
        
        # Verify the user can be authenticated
        authenticated_user = User.objects.get(username='testuser')
        self.assertTrue(authenticated_user.check_password('TestPassword123!'))
    
    def test_create_user_with_weak_password(self):
        """Test creating a user with a weak password."""
        invalid_data = self.valid_user_data.copy()
        invalid_data['password'] = 'password'  # Too common
        
        with self.assertRaises(ValidationError):
            UserService.create_user(invalid_data)
    
    def test_create_user_with_missing_fields(self):
        """Test creating a user with missing required fields."""
        # Missing username
        invalid_data = {
            'password': 'TestPassword123!',
            'display_name': 'Test User'
        }
        
        with self.assertRaises(ValidationError):
            UserService.create_user(invalid_data)
        
        # Missing password
        invalid_data = {
            'username': 'testuser',
            'display_name': 'Test User'
        }
        
        with self.assertRaises(ValidationError):
            UserService.create_user(invalid_data)
        
        # Missing display_name
        invalid_data = {
            'username': 'testuser',
            'password': 'TestPassword123!'
        }
        
        # This should actually raise KeyError since display_name is accessed directly in create_user
        with self.assertRaises(ValidationError):
            UserService.create_user(invalid_data)
    
    def test_create_user_with_existing_username(self):
        """Test creating a user with an existing username."""
        invalid_data = self.valid_user_data.copy()
        invalid_data['username'] = 'existinguser'
        
        with self.assertRaises(Exception):  # Django will raise an IntegrityError for duplicate username
            UserService.create_user(invalid_data)
    
    def test_login_user(self):
        """Test logging in a user."""
        user_data = UserService.login_user(self.request, self.user)
        
        # Check user data is correct
        self.assertEqual(user_data['user']['id'], self.user.id)
        self.assertEqual(user_data['user']['username'], 'existinguser')
        self.assertEqual(user_data['user']['display_name'], 'Existing User')
        
        # Check session contains the user ID
        self.assertEqual(int(self.request.session['_auth_user_id']), self.user.id)
    
    def test_logout_user(self):
        """Test logging out a user."""
        # First login the user
        UserService.login_user(self.request, self.user)
        
        # Then logout
        UserService.logout_user(self.request)
        
        # Check session doesn't contain user ID
        self.assertNotIn('_auth_user_id', self.request.session)