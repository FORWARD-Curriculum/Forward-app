from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError
from core.models import User, Lesson, TextContent, Quiz, Question, Poll, PollQuestion, Writing, UserQuizResponse, UserQuestionResponse

User = get_user_model()

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

class QuizResponseModelTests(TestCase):
    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(
            username='testuser',
            password='testpassword',
            display_name='Test User'
        )
        
        # Create multiple users for testing constraints
        self.user2 = User.objects.create_user(
            username='testuser2',
            password='testpassword',
            display_name='Test User 2'
        )
        
        self.user3 = User.objects.create_user(
            username='testuser3',
            password='testpassword',
            display_name='Test User 3'
        )
        
        self.user4 = User.objects.create_user(
            username='testuser4',
            password='testpassword',
            display_name='Test User 4'
        )
        
        self.user5 = User.objects.create_user(
            username='testuser5',
            password='testpassword',
            display_name='Test User 5'
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
        self.multiple_choice_question = Question.objects.create(
            quiz=self.quiz,
            question_text='Multiple choice question',
            question_type='multiple_choice',
            has_correct_answer=True,
            choices={
                'options': [
                    {'id': 'option_a', 'text': 'Option A'},
                    {'id': 'option_b', 'text': 'Option B'},
                    {'id': 'option_c', 'text': 'Option C'}
                ],
                'correct_answers': ['option_a']
            },
            is_required=True,
            order=1
        )
        
        self.multiple_select_question = Question.objects.create(
            quiz=self.quiz,
            question_text='Multiple select question',
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
        
        self.true_false_question = Question.objects.create(
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
            question_text='Opinion question',
            question_type='multiple_choice',
            has_correct_answer=False,
            choices={
                'options': [
                    {'id': 'option_a', 'text': 'Option A'},
                    {'id': 'option_b', 'text': 'Option B'},
                    {'id': 'option_c', 'text': 'Option C'}
                ]
            },
            is_required=False,
            order=4
        )

    def test_quiz_response_creation(self):
        """Test that a quiz response can be created"""
        quiz_response = UserQuizResponse.objects.create(
            user=self.user,
            quiz=self.quiz,
            is_complete=False
        )
        
        self.assertEqual(quiz_response.user, self.user)
        self.assertEqual(quiz_response.associated_activity, self.quiz)
        self.assertFalse(quiz_response.partial_response)
        self.assertIsNone(quiz_response.score)
        self.assertIsNotNone(quiz_response.updated_at)
        self.assertIsNotNone(quiz_response.created_at)

    def test_question_response_creation(self):
        """Test that question responses can be created"""
        quiz_response = UserQuizResponse.objects.create(
            user=self.user,
            quiz=self.quiz,
            is_complete=False
        )
        
        # Create a response to the multiple choice question
        mc_response = UserQuestionResponse.objects.create(
            quiz_response=quiz_response,
            question=self.multiple_choice_question,
            response_data={'selected': 'option_a'}
        )
        
        self.assertEqual(mc_response.quiz_response, quiz_response)
        self.assertEqual(mc_response.question, self.multiple_choice_question)
        self.assertEqual(mc_response.response_data, {'selected': 'option_a'})
        self.assertIsNone(mc_response.is_correct)  # Not evaluated yet

    def test_evaluate_multiple_choice_correctness(self):
        """Test that multiple choice responses are evaluated correctly"""
        # Create two separate quiz responses with different users to avoid unique constraint
        quiz_response1 = UserQuizResponse.objects.create(
            user=self.user,
            quiz=self.quiz,
            is_complete=False
        )
        
        quiz_response2 = UserQuizResponse.objects.create(
            user=self.user2,  # Different user
            quiz=self.quiz,
            is_complete=False
        )
        
        # Correct response
        correct_response = UserQuestionResponse.objects.create(
            quiz_response=quiz_response1,
            question=self.multiple_choice_question,
            response_data={'selected': 'option_a'}
        )
        correct_response.evaluate_correctness()
        self.assertTrue(correct_response.is_correct)
        
        # Incorrect response
        incorrect_response = UserQuestionResponse.objects.create(
            quiz_response=quiz_response2,
            question=self.multiple_choice_question,
            response_data={'selected': 'option_b'}
        )
        incorrect_response.evaluate_correctness()
        self.assertFalse(incorrect_response.is_correct)

    def test_evaluate_multiple_select_correctness(self):
        """Test that multiple select responses are evaluated correctly"""
        # Create separate quiz responses with different users to avoid unique constraint
        quiz_response1 = UserQuizResponse.objects.create(
            user=self.user,
            quiz=self.quiz,
            is_complete=False
        )
        
        quiz_response2 = UserQuizResponse.objects.create(
            user=self.user2,
            quiz=self.quiz,
            is_complete=False
        )
        
        quiz_response3 = UserQuizResponse.objects.create(
            user=self.user3,
            quiz=self.quiz,
            is_complete=False
        )
        
        quiz_response4 = UserQuizResponse.objects.create(
            user=self.user4,
            quiz=self.quiz,
            is_complete=False
        )
        
        # Correct response (exact match)
        correct_response = UserQuestionResponse.objects.create(
            quiz_response=quiz_response1,
            question=self.multiple_select_question,
            response_data={'selected': ['option_a', 'option_c']}
        )
        correct_response.evaluate_correctness()
        self.assertTrue(correct_response.is_correct)
        
        # Correct response (different order)
        correct_response2 = UserQuestionResponse.objects.create(
            quiz_response=quiz_response2,
            question=self.multiple_select_question,
            response_data={'selected': ['option_c', 'option_a']}
        )
        correct_response2.evaluate_correctness()
        self.assertTrue(correct_response2.is_correct)
        
        # Incorrect response (missing option)
        incorrect_response1 = UserQuestionResponse.objects.create(
            quiz_response=quiz_response3,
            question=self.multiple_select_question,
            response_data={'selected': ['option_a']}
        )
        incorrect_response1.evaluate_correctness()
        self.assertFalse(incorrect_response1.is_correct)
        
        # Incorrect response (extra option)
        incorrect_response2 = UserQuestionResponse.objects.create(
            quiz_response=quiz_response4,
            question=self.multiple_select_question,
            response_data={'selected': ['option_a', 'option_b', 'option_c']}
        )
        incorrect_response2.evaluate_correctness()
        self.assertFalse(incorrect_response2.is_correct)

    def test_evaluate_true_false_correctness(self):
        """Test that true/false responses are evaluated correctly"""
        # Create separate quiz responses with different users
        quiz_response1 = UserQuizResponse.objects.create(
            user=self.user,
            quiz=self.quiz,
            is_complete=False
        )
        
        quiz_response2 = UserQuizResponse.objects.create(
            user=self.user2,
            quiz=self.quiz,
            is_complete=False
        )
        
        # Correct response
        correct_response = UserQuestionResponse.objects.create(
            quiz_response=quiz_response1,
            question=self.true_false_question,
            response_data={'selected': True}
        )
        correct_response.evaluate_correctness()
        self.assertTrue(correct_response.is_correct)
        
        # Incorrect response
        incorrect_response = UserQuestionResponse.objects.create(
            quiz_response=quiz_response2,
            question=self.true_false_question,
            response_data={'selected': False}
        )
        incorrect_response.evaluate_correctness()
        self.assertFalse(incorrect_response.is_correct)

    def test_opinion_question_no_correctness(self):
        """Test that opinion questions don't have correctness evaluation"""
        quiz_response = UserQuizResponse.objects.create(
            user=self.user5,  # Use a different user
            quiz=self.quiz,
            is_complete=False
        )
        
        # Response to opinion question
        opinion_response = UserQuestionResponse.objects.create(
            quiz_response=quiz_response,
            question=self.opinion_question,
            response_data={'selected': 'option_b'}
        )
        opinion_response.evaluate_correctness()
        self.assertIsNone(opinion_response.is_correct)

    def test_quiz_score_calculation(self):
        """Test that quiz scores are calculated correctly"""
        quiz_response = UserQuizResponse.objects.create(
            user=self.user,
            quiz=self.quiz,
            is_complete=True,
        )
        
        # 2 correct responses, 1 incorrect
        UserQuestionResponse.objects.create(
            quiz_response=quiz_response,
            question=self.multiple_choice_question,
            response_data={'selected': 'option_a'},
            is_correct=True
        )
        
        UserQuestionResponse.objects.create(
            quiz_response=quiz_response,
            question=self.multiple_select_question,
            response_data={'selected': ['option_a', 'option_b']},
            is_correct=False
        )
        
        UserQuestionResponse.objects.create(
            quiz_response=quiz_response,
            question=self.true_false_question,
            response_data={'selected': True},
            is_correct=True
        )
        
        # Opinion question (not counted in score)
        UserQuestionResponse.objects.create(
            quiz_response=quiz_response,
            question=self.opinion_question,
            response_data={'selected': 'option_c'},
            is_correct=None
        )
        
        # Calculate the score
        score = quiz_response.calculate_score()
        
        # Should be 2 (2 correct out of 3 gradable questions)
        self.assertEqual(score, 2)
        self.assertEqual(quiz_response.score, 2)

    def test_to_dict_methods(self):
        """Test that the to_dict methods return the expected structure"""
        quiz_response = UserQuizResponse.objects.create(
            user=self.user,
            quiz=self.quiz,
            is_complete=True,
            score=3
        )
        
        question_response = UserQuestionResponse.objects.create(
            quiz_response=quiz_response,
            question=self.multiple_choice_question,
            response_data={'selected': 'option_a'},
            is_correct=True
        )
        
        # Test question response to_dict
        qr_dict = question_response.to_dict()
        self.assertEqual(qr_dict['questionId'], self.multiple_choice_question.id)
        self.assertEqual(qr_dict['quizResponseId'], quiz_response.id)
        self.assertEqual(qr_dict['responseData'], {'selected': 'option_a'})
        self.assertEqual(qr_dict['isCorrect'], True)
        
        # Test quiz response to_dict
        quiz_dict = quiz_response.to_dict()
        self.assertEqual(quiz_dict['userId'], self.user.id)
        self.assertEqual(quiz_dict['quizId'], self.quiz.id)
        self.assertEqual(quiz_dict['score'], 3)
        self.assertEqual(quiz_dict['isComplete'], True)
        self.assertEqual(len(quiz_dict['questionResponses']), 1)