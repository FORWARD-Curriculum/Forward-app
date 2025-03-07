from django.test import TestCase
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError
from core.models import User, Lesson, TextContent, Quiz, Question, Poll, PollQuestion, Writing

class UserModelTests(TestCase):
    """Test cases for the User model."""
    
    def setUp(self):
        """Set up test data for User model tests."""
        self.test_user = User.objects.create_user(
            username='testuser',
            password='TestPassword123!',
            display_name='Test User'
        )
    
    def test_user_creation(self):
        """Test basic user creation and validation."""
        self.assertEqual(self.test_user.username, 'testuser')
        self.assertEqual(self.test_user.display_name, 'Test User')
        self.assertTrue(self.test_user.check_password('TestPassword123!'))
        self.assertFalse(self.test_user.consent)  # Default should be False
    
    def test_string_representation(self):
        """Test the string representation of a User."""
        self.assertEqual(str(self.test_user), 'testuser')
    
    def test_to_dict_method(self):
        """Test to_dict method returns expected dictionary."""
        user_dict = self.test_user.to_dict()
        self.assertEqual(user_dict['id'], self.test_user.id)
        self.assertEqual(user_dict['username'], 'testuser')
        self.assertEqual(user_dict['displayName'], 'Test User')


class LessonModelTests(TestCase):
    """Test cases for the Lesson model."""
    
    def setUp(self):
        """Set up test data for Lesson model tests."""
        self.test_lesson = Lesson.objects.create(
            title='Test Lesson',
            description='A test lesson description',
            objectives=['Learn testing', 'Understand models'],
            order=1,
            tags=['testing', 'models']
        )
    
    def test_lesson_creation(self):
        """Test basic lesson creation and validation."""
        self.assertEqual(self.test_lesson.title, 'Test Lesson')
        self.assertEqual(self.test_lesson.description, 'A test lesson description')
        self.assertEqual(self.test_lesson.objectives, ['Learn testing', 'Understand models'])
        self.assertEqual(self.test_lesson.order, 1)
        self.assertEqual(self.test_lesson.tags, ['testing', 'models'])
    
    def test_string_representation(self):
        """Test the string representation of a Lesson."""
        self.assertEqual(str(self.test_lesson), 'Test Lesson')
    
    def test_to_dict_method(self):
        """Test to_dict method returns expected dictionary."""
        lesson_dict = self.test_lesson.to_dict()
        self.assertEqual(lesson_dict['title'], 'Test Lesson')
        self.assertEqual(lesson_dict['description'], 'A test lesson description')
        self.assertEqual(lesson_dict['objectives'], ['Learn testing', 'Understand models'])
        self.assertEqual(lesson_dict['order'], 1)
        self.assertEqual(lesson_dict['tags'], ['testing', 'models'])
        self.assertEqual(lesson_dict['id'], self.test_lesson.id)


class TextContentModelTests(TestCase):
    """Test cases for the TextContent model."""
    
    def setUp(self):
        """Set up test data for TextContent model tests."""
        self.test_lesson = Lesson.objects.create(
            title='Test Lesson',
            description='A test lesson description',
            objectives=['Learn testing']
        )
        
        self.test_text_content = TextContent.objects.create(
            lesson=self.test_lesson,
            title='Test Content',
            content='This is test content for the lesson.',
            order=1
        )
    
    def test_text_content_creation(self):
        """Test basic text content creation and validation."""
        self.assertEqual(self.test_text_content.title, 'Test Content')
        self.assertEqual(self.test_text_content.content, 'This is test content for the lesson.')
        self.assertEqual(self.test_text_content.order, 1)
        self.assertEqual(self.test_text_content.lesson, self.test_lesson)
    
    def test_string_representation(self):
        """Test the string representation of a TextContent."""
        self.assertEqual(str(self.test_text_content), 'Text Content: Test Content')
    
    def test_to_dict_method(self):
        """Test to_dict method returns expected dictionary."""
        content_dict = self.test_text_content.to_dict()
        self.assertEqual(content_dict['title'], 'Test Content')
        self.assertEqual(content_dict['content'], 'This is test content for the lesson.')
        self.assertEqual(content_dict['order'], 1)
        self.assertEqual(content_dict['lessonId'], self.test_lesson.id)
        self.assertEqual(content_dict['id'], self.test_text_content.id)


class QuizModelTests(TestCase):
    """Test cases for the Quiz model."""
    
    def setUp(self):
        """Set up test data for Quiz model tests."""
        self.test_lesson = Lesson.objects.create(
            title='Test Lesson',
            description='A test lesson description'
        )
        
        self.test_quiz = Quiz.objects.create(
            lesson=self.test_lesson,
            title='Test Quiz',
            instructions='Complete this quiz to test your knowledge.',
            order=1,
            passing_score=70,
            feedback_config={
                'low': 'Keep studying!',
                'medium': 'Good effort!',
                'high': 'Excellent work!'
            }
        )
        
        self.test_question = Question.objects.create(
            quiz=self.test_quiz,
            question_text='What is the purpose of testing?',
            question_type='multiple_choice',
            has_correct_answer=True,
            choices={
                'options': [
                    {'id': 1, 'text': 'To ensure code works', 'is_correct': True},
                    {'id': 2, 'text': 'To waste time', 'is_correct': False},
                    {'id': 3, 'text': 'To complicate code', 'is_correct': False}
                ]
            },
            is_required=True,
            order=1
        )
    
    def test_quiz_creation(self):
        """Test basic quiz creation and validation."""
        self.assertEqual(self.test_quiz.title, 'Test Quiz')
        self.assertEqual(self.test_quiz.instructions, 'Complete this quiz to test your knowledge.')
        self.assertEqual(self.test_quiz.order, 1)
        self.assertEqual(self.test_quiz.passing_score, 70)
        self.assertEqual(self.test_quiz.lesson, self.test_lesson)
        self.assertEqual(
            self.test_quiz.feedback_config,
            {'low': 'Keep studying!', 'medium': 'Good effort!', 'high': 'Excellent work!'}
        )
    
    def test_question_creation(self):
        """Test basic question creation and validation."""
        self.assertEqual(self.test_question.question_text, 'What is the purpose of testing?')
        self.assertEqual(self.test_question.question_type, 'multiple_choice')
        self.assertTrue(self.test_question.has_correct_answer)
        self.assertTrue(self.test_question.is_required)
        self.assertEqual(self.test_question.order, 1)
        self.assertEqual(self.test_question.quiz, self.test_quiz)
        
        # Check choices JSON structure
        self.assertEqual(len(self.test_question.choices['options']), 3)
        self.assertTrue(self.test_question.choices['options'][0]['is_correct'])
    
    def test_quiz_string_representation(self):
        """Test the string representation of a Quiz."""
        self.assertEqual(str(self.test_quiz), 'Quiz - Test Quiz')
    
    def test_question_string_representation(self):
        """Test the string representation of a Question."""
        self.assertEqual(str(self.test_question), 'Question 1: What is the purpose of testing?...')
    
    def test_quiz_to_dict_method(self):
        """Test to_dict method returns expected dictionary for Quiz."""
        quiz_dict = self.test_quiz.to_dict()
        self.assertEqual(quiz_dict['title'], 'Test Quiz')
        self.assertEqual(quiz_dict['instructions'], 'Complete this quiz to test your knowledge.')
        self.assertEqual(quiz_dict['order'], 1)
        self.assertEqual(quiz_dict['passingScore'], 70)
        self.assertEqual(quiz_dict['lessonId'], self.test_lesson.id)
        self.assertEqual(quiz_dict['id'], self.test_quiz.id)
        self.assertEqual(
            quiz_dict['feedbackConfig'],
            {'low': 'Keep studying!', 'medium': 'Good effort!', 'high': 'Excellent work!'}
        )
    
    def test_question_to_dict_method(self):
        """Test to_dict method returns expected dictionary for Question."""
        question_dict = self.test_question.to_dict()
        self.assertEqual(question_dict['questionText'], 'What is the purpose of testing?')
        self.assertEqual(question_dict['questionType'], 'multiple_choice')
        self.assertTrue(question_dict['hasCorrectAnswer'])
        self.assertTrue(question_dict['isRequired'])
        self.assertEqual(question_dict['order'], 1)
        self.assertEqual(question_dict['quizId'], self.test_quiz.id)
        self.assertEqual(question_dict['id'], self.test_question.id)
        
        # Check choices JSON structure
        self.assertEqual(len(question_dict['choices']['options']), 3)
        self.assertTrue(question_dict['choices']['options'][0]['is_correct'])


class PollModelTests(TestCase):
    """Test cases for the Poll model."""
    
    def setUp(self):
        """Set up test data for Poll model tests."""
        self.test_lesson = Lesson.objects.create(
            title='Test Lesson',
            description='A test lesson description'
        )
        
        self.test_poll = Poll.objects.create(
            lesson=self.test_lesson,
            title='Test Poll',
            instructions='Complete this poll to share your opinion.',
            order=1,
            config={
                'display_results': True,
                'allow_anonymous': False
            }
        )
        
        self.test_poll_question = PollQuestion.objects.create(
            poll=self.test_poll,
            question_text='What is your favorite color?',
            options={
                'choices': [
                    {'id': 1, 'text': 'Red'},
                    {'id': 2, 'text': 'Blue'},
                    {'id': 3, 'text': 'Green'}
                ]
            },
            allow_multiple=False,
            order=1
        )
    
    def test_poll_creation(self):
        """Test basic poll creation and validation."""
        self.assertEqual(self.test_poll.title, 'Test Poll')
        self.assertEqual(self.test_poll.instructions, 'Complete this poll to share your opinion.')
        self.assertEqual(self.test_poll.order, 1)
        self.assertEqual(self.test_poll.lesson, self.test_lesson)
        self.assertEqual(
            self.test_poll.config,
            {'display_results': True, 'allow_anonymous': False}
        )
    
    def test_poll_question_creation(self):
        """Test basic poll question creation and validation."""
        self.assertEqual(self.test_poll_question.question_text, 'What is your favorite color?')
        self.assertFalse(self.test_poll_question.allow_multiple)
        self.assertEqual(self.test_poll_question.order, 1)
        self.assertEqual(self.test_poll_question.poll, self.test_poll)
        
        # Check options JSON structure
        self.assertEqual(len(self.test_poll_question.options['choices']), 3)
        self.assertEqual(self.test_poll_question.options['choices'][0]['text'], 'Red')
    
    def test_poll_string_representation(self):
        """Test the string representation of a Poll."""
        self.assertEqual(str(self.test_poll), 'Poll - Test Poll')
    
    def test_poll_question_string_representation(self):
        """Test the string representation of a PollQuestion."""
        self.assertEqual(str(self.test_poll_question), 'Poll Question 1: What is your favorite color?...')
    
    def test_poll_to_dict_method(self):
        """Test to_dict method returns expected dictionary for Poll."""
        poll_dict = self.test_poll.to_dict()
        self.assertEqual(poll_dict['title'], 'Test Poll')
        self.assertEqual(poll_dict['instructions'], 'Complete this poll to share your opinion.')
        self.assertEqual(poll_dict['order'], 1)
        self.assertEqual(poll_dict['lessonId'], self.test_lesson.id)
        self.assertEqual(poll_dict['id'], self.test_poll.id)
        self.assertEqual(
            poll_dict['config'],
            {'display_results': True, 'allow_anonymous': False}
        )
    
    def test_poll_question_to_dict_method(self):
        """Test to_dict method returns expected dictionary for PollQuestion."""
        question_dict = self.test_poll_question.to_dict()
        self.assertEqual(question_dict['questionText'], 'What is your favorite color?')
        self.assertFalse(question_dict['allowMultiple'])
        self.assertEqual(question_dict['order'], 1)
        self.assertEqual(question_dict['pollId'], self.test_poll.id)
        self.assertEqual(question_dict['id'], self.test_poll_question.id)
        
        # Check options JSON structure
        self.assertEqual(len(question_dict['options']['choices']), 3)
        self.assertEqual(question_dict['options']['choices'][0]['text'], 'Red')


class WritingModelTests(TestCase):
    """Test cases for the Writing model."""
    
    def setUp(self):
        """Set up test data for Writing model tests."""
        self.test_lesson = Lesson.objects.create(
            title='Test Lesson',
            description='A test lesson description'
        )
        
        self.test_writing = Writing.objects.create(
            lesson=self.test_lesson,
            title='Test Writing',
            instructions='Complete this writing activity to improve your skills.',
            order=1,
            prompts=[
                'Write about your favorite hobby.',
                'Describe a challenge you have overcome.'
            ]
        )
    
    def test_writing_creation(self):
        """Test basic writing creation and validation."""
        self.assertEqual(self.test_writing.title, 'Test Writing')
        self.assertEqual(self.test_writing.instructions, 'Complete this writing activity to improve your skills.')
        self.assertEqual(self.test_writing.order, 1)
        self.assertEqual(self.test_writing.lesson, self.test_lesson)
        self.assertEqual(
            self.test_writing.prompts,
            ['Write about your favorite hobby.', 'Describe a challenge you have overcome.']
        )
    
    def test_string_representation(self):
        """Test the string representation of a Writing."""
        self.assertEqual(str(self.test_writing), 'Writing - Test Writing')
    
    def test_get_prompts_method(self):
        """Test get_prompts method returns expected list."""
        self.assertEqual(
            self.test_writing.get_prompts(),
            ['Write about your favorite hobby.', 'Describe a challenge you have overcome.']
        )
        
        # Test with no prompts
        empty_writing = Writing.objects.create(
            lesson=self.test_lesson,
            title='Empty Writing',
            instructions='No prompts provided.',
            order=2
        )
        self.assertEqual(empty_writing.get_prompts(), [])
    
    def test_to_dict_method(self):
        """Test to_dict method returns expected dictionary."""
        writing_dict = self.test_writing.to_dict()
        self.assertEqual(writing_dict['title'], 'Test Writing')
        self.assertEqual(writing_dict['instructions'], 'Complete this writing activity to improve your skills.')
        self.assertEqual(writing_dict['order'], 1)
        self.assertEqual(writing_dict['lessonId'], self.test_lesson.id)
        self.assertEqual(writing_dict['id'], self.test_writing.id)
        self.assertEqual(
            writing_dict['prompts'],
            ['Write about your favorite hobby.', 'Describe a challenge you have overcome.']
        )