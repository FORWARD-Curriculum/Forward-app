from django.test import TestCase
from django.urls import reverse, resolve
from api.views import (
    UserRegistrationView, SessionView, CurrentUserView, 
    QuizView, LessonView, TextContentView, WritingView, PollView
)


class UrlsTests(TestCase):
    """Test cases for URL patterns."""
    
    def test_user_register_url(self):
        """Test the user registration URL."""
        url = reverse('user-register')
        self.assertEqual(url, '/api/users/')
        
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, UserRegistrationView)
    
    def test_current_user_url(self):
        """Test the current user URL."""
        url = reverse('current-user')
        self.assertEqual(url, '/api/users/me/')
        
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, CurrentUserView)
    
    def test_sessions_url(self):
        """Test the sessions URL."""
        url = reverse('sessions')
        self.assertEqual(url, '/api/sessions/')
        
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, SessionView)
    
    def test_quizzes_url(self):
        """Test the quizzes URL."""
        url = reverse('quizes', args=[1])
        self.assertEqual(url, '/api/quizzes/1')
        
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, QuizView)
    
    def test_lessons_url(self):
        """Test the lessons URL."""
        url = reverse('lessons', args=[1])
        self.assertEqual(url, '/api/lessons/1')
        
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, LessonView)
    
    def test_text_content_url(self):
        """Test the text content URL."""
        url = reverse('text-content', args=[1])
        self.assertEqual(url, '/api/text_content/1')
        
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, TextContentView)
    
    def test_writings_url(self):
        """Test the writings URL."""
        url = reverse('writings', args=[1])
        self.assertEqual(url, '/api/writings/1')
        
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, WritingView)
    
    def test_polls_url(self):
        """Test the polls URL."""
        url = reverse('polls', args=[1])
        self.assertEqual(url, '/api/polls/1')
        
        resolver = resolve(url)
        self.assertEqual(resolver.func.view_class, PollView)