from django.test import TestCase, RequestFactory
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.contrib.sessions.middleware import SessionMiddleware
from core.services import UserService, QuizResponseService, LessonService
from core.models import User, Lesson, Quiz, Question, UserQuizResponse, UserQuestionResponse, TextContent, Writing

User = get_user_model()

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

class UserServiceAdvancedTests(TestCase):
    """Advanced test cases for UserService."""
    
    def setUp(self):
        """Set up test data."""
        self.factory = RequestFactory()
        self.request = self.factory.get('/')
        
        # Add session to request
        middleware = SessionMiddleware(lambda req: None)
        middleware.process_request(self.request)
        self.request.session.save()
    
    def test_create_user_with_special_characters(self):
        """Test creating a user with special characters in fields."""
        user_data = {
            'username': 'test_user@example',  # Contains @ and _
            'password': 'TestPassword123!',
            'display_name': "O'Connor-Smith"  # Contains apostrophe and hyphen
        }
        
        user = UserService.create_user(user_data)
        
        self.assertEqual(user.username, 'test_user@example')
        self.assertEqual(user.display_name, "O'Connor-Smith")
        
        # Verify the user can be authenticated
        authenticated_user = User.objects.get(username='test_user@example')
        self.assertTrue(authenticated_user.check_password('TestPassword123!'))
    
    def test_create_user_with_minimal_fields(self):
        """Test creating a user with only the required fields."""
        user_data = {
            'username': 'minimaluser',
            'password': 'MinimalPassword123!',
            'display_name': 'Minimal'
        }
        
        user = UserService.create_user(user_data)
        
        self.assertEqual(user.username, 'minimaluser')
        self.assertEqual(user.display_name, 'Minimal')
        self.assertEqual(user.facility_id, '')  # Should be empty string
        self.assertIsNone(user.profile_picture)
        self.assertFalse(user.consent)  # Should default to False
    
    def test_create_user_with_very_long_fields(self):
        """Test creating a user with very long field values."""
        # Create a very long display name (should be limited to 50 chars)
        long_display_name = 'X' * 100
        
        user_data = {
            'username': 'longuser',
            'password': 'LongPassword123!',
            'display_name': long_display_name
        }
        
        # This should raise a validation error since display_name is too long
        with self.assertRaises(ValidationError):
            UserService.create_user(user_data)
    
    def test_login_nonexistent_user(self):
        """Test logging in a nonexistent user."""
        non_user = User(
            username='nonexistentuser',
            display_name='Nonexistent User'
        )
        
        # Since the user doesn't exist in the database, this should fail
        with self.assertRaises(ValidationError):
            UserService.login_user(self.request, non_user)
    
    def test_logout_already_logged_out_user(self):
        """Test logging out a user who is already logged out."""
        # This should not raise an error
        UserService.logout_user(self.request)
        
        # Log out again
        UserService.logout_user(self.request)
        
        # Verify session doesn't contain user ID
        self.assertNotIn('_auth_user_id', self.request.session)

class LessonServiceTests(TestCase):
    """Test cases for LessonService."""
    
    def setUp(self):
        """Set up test data."""
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            password='TestPassword123!',
            display_name='Test User'
        )
        
        # Create a lesson with multiple activity types
        self.lesson = Lesson.objects.create(
            title='Test Lesson',
            description='This is a test lesson with multiple activities',
            objectives=['Learn testing', 'Master Django'],
            order=1,
            tags=['test', 'django']
        )
        
        # Create text content for the lesson
        self.text1 = TextContent.objects.create(
            lesson=self.lesson,
            title='Introduction',
            content='Welcome to this test lesson.',
            order=1
        )
        
        self.text2 = TextContent.objects.create(
            lesson=self.lesson,
            title='Conclusion',
            content='Thank you for completing this test lesson.',
            order=5
        )
        
        # Create a quiz
        self.quiz = Quiz.objects.create(
            lesson=self.lesson,
            title='Test Quiz',
            instructions='Complete this quiz',
            order=2,
            passing_score=70,
            feedback_config={'default': 'Good job!'}
        )
        
        # Create quiz questions
        self.question = Question.objects.create(
            quiz=self.quiz,
            question_text='What is the main purpose of testing?',
            question_type='multiple_choice',
            has_correct_answer=True,
            choices={
                'options': [
                    {'id': 'a', 'text': 'To find bugs'},
                    {'id': 'b', 'text': 'To improve quality'},
                    {'id': 'c', 'text': 'To verify requirements'}
                ],
                'correct_answers': ['b']
            },
            is_required=True,
            order=1
        )
        
        # Create a writing activity
        self.writing = Writing.objects.create(
            lesson=self.lesson,
            title='Test Writing Activity',
            instructions='Write a brief essay about Django',
            order=4,
            prompts=['What do you like about Django?', 'How would you improve Django?']
        )
    
    def test_get_lesson_content_with_all_activity_types(self):
        """Test retrieving lesson content with all types of activities."""
        lesson_content = LessonService.get_lesson_content(self.lesson.id)
        
        # Check that lesson data is correct
        self.assertEqual(lesson_content['lesson']['id'], self.lesson.id)
        self.assertEqual(lesson_content['lesson']['title'], 'Test Lesson')
        self.assertEqual(lesson_content['lesson']['description'], 'This is a test lesson with multiple activities')
        self.assertEqual(lesson_content['lesson']['objectives'], ['Learn testing', 'Master Django'])
        
        # Check that activities are present and in correct order
        activities = lesson_content['lesson']['activities']
        self.assertEqual(len(activities), 5)  # Should have 5 activities
        
        # Check text content
        self.assertEqual(activities[1]['title'], 'Introduction')
        self.assertEqual(activities[1]['type'], 'TextContent')
        self.assertEqual(activities[1]['content'], 'Welcome to this test lesson.')
        
        # Check quiz
        self.assertEqual(activities[2]['title'], 'Test Quiz')
        self.assertEqual(activities[2]['type'], 'Quiz')
        self.assertEqual(len(activities[2]['questions']), 1)
        self.assertEqual(activities[2]['questions'][0]['questionText'], 'What is the main purpose of testing?')
        
        # Check writing activity
        self.assertEqual(activities[4]['title'], 'Test Writing Activity')
        self.assertEqual(activities[4]['type'], 'Writing')
        self.assertEqual(activities[4]['prompts'], ['What do you like about Django?', 'How would you improve Django?'])
        
        # Check final text content
        self.assertEqual(activities[5]['title'], 'Conclusion')
        self.assertEqual(activities[5]['type'], 'TextContent')
    
    def test_get_lesson_content_nonexistent_lesson(self):
        """Test retrieving content for a nonexistent lesson."""
        with self.assertRaises(Lesson.DoesNotExist):
            LessonService.get_lesson_content(999)  # Assuming this ID doesn't exist
    
    def test_get_lesson_content_empty_lesson(self):
        """Test retrieving content for a lesson with no activities."""
        # Create a new lesson with no activities
        empty_lesson = Lesson.objects.create(
            title='Empty Lesson',
            description='This lesson has no activities',
            objectives=['Just an objective']
        )
        
        lesson_content = LessonService.get_lesson_content(empty_lesson.id)
        
        # Check lesson data
        self.assertEqual(lesson_content['lesson']['id'], empty_lesson.id)
        self.assertEqual(lesson_content['lesson']['title'], 'Empty Lesson')
        
        # Check that activities dict is empty
        self.assertEqual(len(lesson_content['lesson']['activities']), 0)

class QuizResponseServiceTests(TestCase):
    def setUp(self):
        # Create multiple users for testing
        self.user = User.objects.create_user(
            username='testuser',
            password='testpassword',
            display_name='Test User'
        )
        
        self.user2 = User.objects.create_user(
            username='testuser2',
            password='testpassword',
            display_name='Test User 2'
        )
        
        # Create a lesson
        self.lesson = Lesson.objects.create(
            title='Test Lesson',
            description='Test lesson description',
            objectives=['Learn testing']
        )
        
        # Create a quiz
        self.quiz = Quiz.objects.create(
            lesson=self.lesson,
            title='Test Quiz',
            instructions='Answer all questions',
            order=1,
            passing_score=2,
            feedback_config={'default': 'Good job!'}
        )
        
        # Create questions
        self.question1 = Question.objects.create(
            quiz=self.quiz,
            question_text='Question 1',
            question_type='multiple_choice',
            has_correct_answer=True,
            choices={
                'options': [
                    {'id': 'option_a', 'text': 'Option A'},
                    {'id': 'option_b', 'text': 'Option B'}
                ],
                'correct_answers': ['option_a']
            },
            is_required=True,
            order=1
        )
        
        self.question2 = Question.objects.create(
            quiz=self.quiz,
            question_text='Question 2',
            question_type='multiple_select',
            has_correct_answer=True,
            choices={
                'options': [
                    {'id': 'option_a', 'text': 'Option A'},
                    {'id': 'option_b', 'text': 'Option B'},
                    {'id': 'option_c', 'text': 'Option C'}
                ],
                'correct_answers': ['option_a', 'option_c']
            },
            is_required=True,
            order=2
        )

    def test_submit_new_quiz_response(self):
        """Test submitting a new quiz response"""
        submission_data = {
            'quiz_id': self.quiz.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.question1.id,
                    'response_data': {'selected': 'option_a'}
                },
                {
                    'question_id': self.question2.id,
                    'response_data': {'selected': ['option_a', 'option_c']}
                }
            ]
        }
        
        # Submit the quiz response
        quiz_response = QuizResponseService.submit_quiz_response(
            user=self.user,
            data=submission_data
        )
        
        quiz_response = quiz_response['quiz_response']

        # Verify response was created
        self.assertEqual(quiz_response.user, self.user)
        self.assertEqual(quiz_response.quiz, self.quiz)
        self.assertTrue(quiz_response.is_complete)
        
        # Verify question responses were created
        self.assertEqual(quiz_response.question_responses.count(), 2)
        
        # Verify scores were calculated
        self.assertEqual(quiz_response.score, 2)  # Both answers are correct
        
        # Check that question responses were evaluated
        for qr in quiz_response.question_responses.all():
            self.assertTrue(qr.is_correct)

    def test_submit_multiple_quiz_responses(self):
        """Test submitting multiple quiz responses and verify the count"""
        # Create a second quiz in the same lesson
        quiz2 = Quiz.objects.create(
            lesson=self.lesson,
            title='Second Quiz',
            instructions='Complete this second quiz',
            order=2,
            passing_score=1,
            feedback_config={'default': 'Good job!'}
        )
        
        # Create a question for the second quiz
        question2 = Question.objects.create(
            quiz=quiz2,
            question_text='Sample question for quiz 2?',
            question_type='multiple_choice',
            has_correct_answer=True,
            choices={
                'options': [
                    {'id': 'a', 'text': 'Option A'},
                    {'id': 'b', 'text': 'Option B'}
                ],
                'correct_answers': ['a']
            },
            is_required=True,
            order=1
        )
        
        # Submit a response for the first quiz
        first_submission = {
            'quiz_id': self.quiz.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.question1.id,
                    'response_data': {'selected': 'option_a'}
                }
            ]
        }
        
        first_response = QuizResponseService.submit_quiz_response(
            user=self.user,
            data=first_submission
        )
        
        # Submit a response for the second quiz
        second_submission = {
            'quiz_id': quiz2.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': question2.id,
                    'response_data': {'selected': 'a'}
                }
            ]
        }
        
        second_response = QuizResponseService.submit_quiz_response(
            user=self.user,
            data=second_submission
        )
        
        # Submit another response for the first quiz (should update, not create new)
        updated_submission = {
            'quiz_id': self.quiz.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.question1.id,
                    'response_data': {'selected': 'option_b'}
                }
            ]
        }
        
        updated_response = QuizResponseService.submit_quiz_response(
            user=self.user,
            data=updated_submission
        )

        # Have the second user submit a response for the first quiz
        user2_submission = {
            'quiz_id': self.quiz.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.question1.id,
                    'response_data': {'selected': 'option_b'}
                }
            ]
        }
        
        user2_response = QuizResponseService.submit_quiz_response(
            user=self.user2,
            data=user2_submission
        )
        
        # Get all responses for the user
        all_responses = QuizResponseService.get_user_quiz_responses(self.user)
        
        # Verify there are only 2 responses (one per quiz)
        self.assertEqual(all_responses.count(), 2)

        first_response = first_response['quiz_response']
        second_response = second_response['quiz_response']
        updated_response = updated_response['quiz_response']
        
        # Verify each quiz has exactly one response for the first user
        quiz1_responses = QuizResponseService.get_user_quiz_responses(self.user, self.quiz.id)
        self.assertEqual(quiz1_responses.count(), 1)
        self.assertEqual(quiz1_responses.first().id, first_response.id)
        self.assertEqual(quiz1_responses.first().id, updated_response.id)  # Should be the same ID
        
        quiz2_responses = QuizResponseService.get_user_quiz_responses(self.user, quiz2.id)
        self.assertEqual(quiz2_responses.count(), 1)
        self.assertEqual(quiz2_responses.first().id, second_response.id)
        
        # Verify there are 3 responses in total in the database
        # (2 from first user + 1 from second user)
        self.assertEqual(UserQuizResponse.objects.all().count(), 3)
        
        # Verify there are 2 responses for first user
        self.assertEqual(UserQuizResponse.objects.filter(user=self.user).count(), 2)
        
        # Verify there is 1 response for second user
        self.assertEqual(UserQuizResponse.objects.filter(user=self.user2).count(), 1)

    def test_submit_partial_quiz_response(self):
        """Test submitting a partial quiz response (for autosave)"""
        submission_data = {
            'quiz_id': self.quiz.id,
            'is_complete': False,
            'question_responses': [
                {
                    'question_id': self.question1.id,
                    'response_data': {'selected': 'option_a'}
                }
            ]
        }
        
        # Submit partial response
        quiz_response = QuizResponseService.submit_quiz_response(
            user=self.user,
            data=submission_data
        )

        quiz_response = quiz_response['quiz_response']
        
        # Verify response was created but not marked complete
        self.assertEqual(quiz_response.user, self.user)
        self.assertEqual(quiz_response.quiz, self.quiz)
        self.assertFalse(quiz_response.is_complete)
        self.assertIsNone(quiz_response.score)  # Score not calculated for incomplete
        
        # Verify only one question response was created
        self.assertEqual(quiz_response.question_responses.count(), 1)
        
        # Verify question response was evaluated
        question_response = quiz_response.question_responses.first()
        self.assertTrue(question_response.is_correct)

    def test_update_existing_quiz_response(self):
        """Test updating an existing quiz response"""
        # First create a partial response
        first_submission = {
            'quiz_id': self.quiz.id,
            'is_complete': False,
            'question_responses': [
                {
                    'question_id': self.question1.id,
                    'response_data': {'selected': 'option_b'}  # Incorrect
                }
            ]
        }
        
        quiz_response = QuizResponseService.submit_quiz_response(
            user=self.user,
            data=first_submission
        )

        quiz_response = quiz_response['quiz_response']
        
        # Now update it with complete submission
        updated_submission = {
            'quiz_id': self.quiz.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.question1.id,
                    'response_data': {'selected': 'option_a'}  # Correct
                },
                {
                    'question_id': self.question2.id,
                    'response_data': {'selected': ['option_a', 'option_c']}  # Correct
                }
            ]
        }
        
        updated_response = QuizResponseService.submit_quiz_response(
            user=self.user,
            data=updated_submission
        )

        updated_response = updated_response['quiz_response']
        
        # Verify it's the same response object
        self.assertEqual(quiz_response.id, updated_response.id)
        
        # Verify it's now complete with a score
        self.assertTrue(updated_response.is_complete)
        self.assertEqual(updated_response.score, 2)
        
        # Verify question responses
        self.assertEqual(updated_response.question_responses.count(), 2)
        
        # Verify first question was updated (from incorrect to correct)
        q1_response = updated_response.question_responses.get(question=self.question1)
        self.assertEqual(q1_response.response_data, {'selected': 'option_a'})
        self.assertTrue(q1_response.is_correct)

    def test_get_user_quiz_responses(self):
        """Test retrieving a user's quiz responses"""
        # Create two quiz responses
        quiz_response1 = UserQuizResponse.objects.create(
            user=self.user,
            quiz=self.quiz,
            is_complete=True,
            score=2,
        )
        
        # Create another quiz
        quiz2 = Quiz.objects.create(
            lesson=self.lesson,
            title='Another Quiz',
            instructions='Complete this quiz',
            order=2,
            passing_score=1,
            feedback_config={'default': 'Nice work!'}
        )
        
        quiz_response2 = UserQuizResponse.objects.create(
            user=self.user,
            quiz=quiz2,
            is_complete=True,
            score=1,
        )
        
        # Get all responses
        all_responses = QuizResponseService.get_user_quiz_responses(self.user)
        self.assertEqual(all_responses.count(), 2)
        
        # Get responses for specific quiz
        quiz1_responses = QuizResponseService.get_user_quiz_responses(self.user, self.quiz.id)
        self.assertEqual(quiz1_responses.count(), 1)
        self.assertEqual(quiz1_responses.first().id, quiz_response1.id)

    def test_get_quiz_response_details(self):
        """Test retrieving details for a specific quiz response"""
        # Create a quiz response with question responses
        quiz_response = UserQuizResponse.objects.create(
            user=self.user2,  # Use a different user since self.user has already created a response in another test
            quiz=self.quiz,
            is_complete=True,
            score=1,
        )
        
        UserQuestionResponse.objects.create(
            quiz_response=quiz_response,
            question=self.question1,
            response_data={'selected': 'option_a'},
            is_correct=True
        )
        
        UserQuestionResponse.objects.create(
            quiz_response=quiz_response,
            question=self.question2,
            response_data={'selected': ['option_a', 'option_b']},
            is_correct=False
        )
        
        # Get details
        response_details = QuizResponseService.get_quiz_response_details(
            user=self.user2,
            response_id=quiz_response.id
        )
        
        # Verify basic details
        self.assertEqual(response_details.id, quiz_response.id)
        self.assertEqual(response_details.score, 1)
        
        # Verify question responses are accessible
        self.assertEqual(response_details.question_responses.count(), 2)

class ExtendedQuizResponseServiceTests(TestCase):
    """Additional test cases for QuizResponseService."""
    
    def setUp(self):
        """Set up test data."""
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            password='TestPassword123!',
            display_name='Test User'
        )
        
        # Create a lesson
        self.lesson = Lesson.objects.create(
            title='Test Lesson',
            description='Test lesson description'
        )
        
        # Create a quiz
        self.quiz = Quiz.objects.create(
            lesson=self.lesson,
            title='Test Quiz',
            instructions='Complete this quiz',
            order=1,
            passing_score=2,
            feedback_config={'default': 'Good job!'}
        )
        
        # Create questions with different types
        self.mc_question = Question.objects.create(
            quiz=self.quiz,
            question_text='Multiple choice question',
            question_type='multiple_choice',
            has_correct_answer=True,
            choices={
                'options': [
                    {'id': 'a', 'text': 'Option A'},
                    {'id': 'b', 'text': 'Option B'},
                    {'id': 'c', 'text': 'Option C'}
                ],
                'correct_answers': ['a']
            },
            is_required=True,
            order=1
        )
        
        self.ms_question = Question.objects.create(
            quiz=self.quiz,
            question_text='Multiple select question',
            question_type='multiple_select',
            has_correct_answer=True,
            choices={
                'options': [
                    {'id': 'a', 'text': 'Option A'},
                    {'id': 'b', 'text': 'Option B'},
                    {'id': 'c', 'text': 'Option C'}
                ],
                'correct_answers': ['a', 'c']
            },
            is_required=True,
            order=2
        )
        
        self.tf_question = Question.objects.create(
            quiz=self.quiz,
            question_text='True/False question',
            question_type='true_false',
            has_correct_answer=True,
            choices={
                'options': [
                    {'id': 'true', 'text': 'True'},
                    {'id': 'false', 'text': 'False'}
                ],
                'correct_answers': True
            },
            is_required=True,
            order=3
        )
        
        self.opinion_question = Question.objects.create(
            quiz=self.quiz,
            question_text='Opinion question (no correct answer)',
            question_type='multiple_choice',
            has_correct_answer=False,
            choices={
                'options': [
                    {'id': 'a', 'text': 'Option A'},
                    {'id': 'b', 'text': 'Option B'},
                    {'id': 'c', 'text': 'Option C'}
                ]
            },
            is_required=False,
            order=4
        )
    
    def test_quiz_response_with_all_question_types(self):
        """Test a quiz response with all different question types."""
        submission_data = {
            'quiz_id': self.quiz.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.mc_question.id,
                    'response_data': {'selected': 'a'}  # Correct
                },
                {
                    'question_id': self.ms_question.id,
                    'response_data': {'selected': ['a', 'c']}  # Correct
                },
                {
                    'question_id': self.tf_question.id,
                    'response_data': {'selected': True}  # Correct
                },
                {
                    'question_id': self.opinion_question.id,
                    'response_data': {'selected': 'b'}  # No correct answer
                }
            ]
        }
        
        quiz_response = QuizResponseService.submit_quiz_response(
            user=self.user,
            data=submission_data
        )

        quiz_response = quiz_response['quiz_response']
        
        # Verify all responses were recorded
        self.assertEqual(quiz_response.question_responses.count(), 4)
        
        # Verify score calculation
        self.assertEqual(quiz_response.score, 3)  # 3 correct answers, 1 not gradable
        
        # Verify correctness for each question type
        mc_response = quiz_response.question_responses.get(question=self.mc_question)
        self.assertTrue(mc_response.is_correct)
        
        ms_response = quiz_response.question_responses.get(question=self.ms_question)
        self.assertTrue(ms_response.is_correct)
        
        tf_response = quiz_response.question_responses.get(question=self.tf_question)
        self.assertTrue(tf_response.is_correct)
        
        opinion_response = quiz_response.question_responses.get(question=self.opinion_question)
        self.assertIsNone(opinion_response.is_correct)  # Should be None for ungradable questions
    
    def test_quiz_response_with_incorrect_answers(self):
        """Test a quiz response with incorrect answers."""
        submission_data = {
            'quiz_id': self.quiz.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.mc_question.id,
                    'response_data': {'selected': 'b'}  # Incorrect
                },
                {
                    'question_id': self.ms_question.id,
                    'response_data': {'selected': ['a', 'b']}  # Incorrect
                },
                {
                    'question_id': self.tf_question.id,
                    'response_data': {'selected': False}  # Incorrect
                }
            ]
        }
        
        quiz_response = QuizResponseService.submit_quiz_response(
            user=self.user,
            data=submission_data
        )

        quiz_response = quiz_response['quiz_response']
        
        # Verify score calculation
        self.assertEqual(quiz_response.score, 0)  # 0 correct answers
        
        # Verify each response is marked incorrect
        for response in quiz_response.question_responses.all():
            self.assertFalse(response.is_correct)
    
    def test_calculate_score_with_partially_correct_answers(self):
        """Test score calculation with a mix of correct and incorrect answers."""
        submission_data = {
            'quiz_id': self.quiz.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.mc_question.id,
                    'response_data': {'selected': 'a'}  # Correct
                },
                {
                    'question_id': self.ms_question.id,
                    'response_data': {'selected': ['a', 'b']}  # Incorrect
                },
                {
                    'question_id': self.tf_question.id,
                    'response_data': {'selected': True}  # Correct
                }
            ]
        }
        
        quiz_response = QuizResponseService.submit_quiz_response(
            user=self.user,
            data=submission_data
        )

        quiz_response = quiz_response['quiz_response']
        
        # Verify score calculation
        self.assertEqual(quiz_response.score, 2)  # 2 correct answers
        
        # Verify each response is marked correctly
        mc_response = quiz_response.question_responses.get(question=self.mc_question)
        self.assertTrue(mc_response.is_correct)
        
        ms_response = quiz_response.question_responses.get(question=self.ms_question)
        self.assertFalse(ms_response.is_correct)
        
        tf_response = quiz_response.question_responses.get(question=self.tf_question)
        self.assertTrue(tf_response.is_correct)
    
    def test_get_quiz_response_details_nonexistent(self):
        """Test retrieving details for a nonexistent quiz response."""
        with self.assertRaises(UserQuizResponse.DoesNotExist):
            QuizResponseService.get_quiz_response_details(
                user=self.user,
                response_id=999  # Assuming this ID doesn't exist
            )
    
    def test_get_quiz_response_details_wrong_user(self):
        """Test attempting to access another user's quiz response."""
        # Create another user
        other_user = User.objects.create_user(
            username='otheruser',
            password='OtherPassword123!',
            display_name='Other User'
        )
        
        # Create a quiz response for the other user
        other_response = UserQuizResponse.objects.create(
            user=other_user,
            quiz=self.quiz,
            is_complete=True,
            score=3,
        )
        
        # Try to access it with the original user
        with self.assertRaises(UserQuizResponse.DoesNotExist):
            QuizResponseService.get_quiz_response_details(
                user=self.user,
                response_id=other_response.id
            )