from api.tests import setup_django
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import (
    Lesson, Quiz, Question, 
    UserQuizResponse, UserQuestionResponse
)
import json

User = get_user_model()

class QuizResponseAPITests(TestCase):
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(
            username='testuser',
            password='testpassword',
            display_name='Test User'
        )
        
        self.other_user = User.objects.create_user(
            username='otheruser',
            password='otherpassword',
            display_name='Other User'
        )
        
        # Create additional users for testing
        self.user3 = User.objects.create_user(
            username='testuser3',
            password='testpassword',
            display_name='Test User 3'
        )
        
        # Set up API client
        self.client = APIClient()
        
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
            is_required=False,  # Not required
            order=2
        )

        # Create another quiz with no responses
        self.quiz_2 = Quiz.objects.create(
            lesson=self.lesson,
            title='Quiz 2',
            instructions='This is quiz number 2',
            order=3,
            passing_score=1,
            feedback_config={'default': 'Good effort!'}
        )

        # Create a question for this quiz
        self.question_quiz_2 = Question.objects.create(
            quiz=self.quiz_2,
            question_text='New Quiz Question',
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
        
        # URLs
        self.quiz_responses_url = reverse('quiz-responses')  # Add this to urls.py
        
        # Create some quiz responses for testing GET requests
        self.quiz_response = UserQuizResponse.objects.create(
            user=self.user,
            quiz=self.quiz,
            is_complete=True,
            score=1,
            time_spent=120
        )
        
        UserQuestionResponse.objects.create(
            quiz_response=self.quiz_response,
            question=self.question1,
            response_data={'selected': 'option_a'},
            is_correct=True,
            time_spent=15
        )
        
        # Response detail URL
        self.detail_url = reverse('quiz-response-detail', args=[self.quiz_response.id])  # Add this to urls.py

    def test_submit_quiz_response_unauthenticated(self):
        """Test that unauthenticated users cannot submit quiz responses"""
        response_data = {
            'quiz_id': self.quiz_2.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.question_quiz_2.id,
                    'response_data': {'selected': 'option_a'}
                }
            ]
        }

        response = self.client.post(
            self.quiz_responses_url,
            data=json.dumps(response_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_submit_complete_quiz_response(self):
        """Test submitting a complete quiz response"""
        self.client.force_authenticate(user=self.user)
        
        response_data = {
            'quiz_id': self.quiz_2.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.question_quiz_2.id,
                    'response_data': {'selected': 'option_a'}
                }
            ]
        }
        
        response = self.client.post(
            self.quiz_responses_url,
            data=json.dumps(response_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify response data
        self.assertEqual(response.data['detail'], 'Quiz response submitted successfully')
        self.assertIn('quiz_response', response.data['data'])
        self.assertEqual(response.data['data']['quiz_response']['quizId'], self.quiz_2.id)
        self.assertTrue(response.data['data']['quiz_response']['isComplete'])
        
        # Verify database was updated
        self.assertEqual(UserQuizResponse.objects.count(), 2)  # Including the one from setUp
        
        # Get the new response
        new_response = UserQuizResponse.objects.exclude(id=self.quiz_response.id).first()
        self.assertEqual(new_response.score, 1)  # 1 correct answer

    def test_submit_partial_quiz_response(self):
        """Test submitting a partial quiz response for autosave"""
        self.client.force_authenticate(user=self.user)
        
        response_data = {
            'quiz_id': self.quiz_2.id,
            'is_complete': False,
            'question_responses': [
                {
                    'question_id': self.question_quiz_2.id,
                    'response_data': {'selected': 'option_b'}
                }
            ]
        }
        
        response = self.client.post(
            self.quiz_responses_url,
            data=json.dumps(response_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify response data
        self.assertFalse(response.data['data']['quiz_response']['isComplete'])
        self.assertIsNone(response.data['data']['quiz_response']['score'])  # No score for incomplete
        
        # Verify database was updated
        new_response = UserQuizResponse.objects.exclude(id=self.quiz_response.id).first()
        self.assertFalse(new_response.is_complete)
        self.assertIsNone(new_response.score)

    def test_submit_invalid_quiz_response(self):
        """Test submitting a quiz response with invalid data"""
        self.client.force_authenticate(user=self.user)
        
        # Invalid quiz ID
        response_data = {
            'quiz_id': 999,  # Non-existent quiz
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.question1.id,
                    'response_data': {'selected': 'option_a'}
                }
            ]
        }
        
        response = self.client.post(
            self.quiz_responses_url,
            data=json.dumps(response_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Missing required question
        response_data = {
            'quiz_id': self.quiz.id,
            'is_complete': True,
            'question_responses': []  # Missing response for required question1
        }
        
        response = self.client.post(
            self.quiz_responses_url,
            data=json.dumps(response_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_quiz_responses(self):
        """Test getting a user's quiz responses"""
        self.client.force_authenticate(user=self.user)
        
        # Create another quiz response
        another_quiz = Quiz.objects.create(
            lesson=self.lesson,
            title='Another Quiz',
            instructions='Another quiz instructions',
            order=2,
            passing_score=1,
            feedback_config={'default': 'Nice work!'}
        )
        
        UserQuizResponse.objects.create(
            user=self.user,
            quiz=another_quiz,
            is_complete=True,
            score=1,
            time_spent=15
        )
        
        # Get all responses
        response = self.client.get(self.quiz_responses_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']['quiz_responses']), 2)
        
        # Get responses for a specific quiz
        response = self.client.get(f"{self.quiz_responses_url}?quiz_id={self.quiz.id}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']['quiz_responses']), 1)
        self.assertEqual(response.data['data']['quiz_responses'][0]['quizId'], self.quiz.id)

    def test_get_quiz_responses_other_user(self):
        """Test that users can only see their own quiz responses"""
        self.client.force_authenticate(user=self.other_user)
        
        response = self.client.get(self.quiz_responses_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']['quiz_responses']), 0)  # No responses for other_user

    def test_get_quiz_response_detail(self):
        """Test getting details for a specific quiz response"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['quiz_response']['id'], self.quiz_response.id)
        self.assertEqual(response.data['data']['quiz_response']['quizId'], self.quiz.id)
        self.assertEqual(len(response.data['data']['quiz_response']['questionResponses']), 1)

    def test_get_quiz_response_detail_other_user(self):
        """Test that users cannot see other users' quiz response details"""
        self.client.force_authenticate(user=self.other_user)
        
        response = self.client.get(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_quiz_response(self):
        """Test updating an existing quiz response"""
        self.client.force_authenticate(user=self.user3)
        
        # Create an initial partial response
        initial_data = {
            'quiz_id': self.quiz.id,
            'is_complete': False,
            'question_responses': [
                {
                    'question_id': self.question1.id,
                    'response_data': {'selected': 'option_b'}
                }
            ]
        }
        
        initial_response = self.client.post(
            self.quiz_responses_url,
            data=json.dumps(initial_data),
            content_type='application/json'
        )
        
        # Now update it with complete submission
        updated_data = {
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
        
        response = self.client.post(
            self.quiz_responses_url,
            data=json.dumps(updated_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Should have 1 quiz response for this user
        self.assertEqual(UserQuizResponse.objects.filter(user=self.user3).count(), 1)
        
        # Response should be complete with score of 2
        new_response_id = response.data['data']['quiz_response']['id']
        new_response = UserQuizResponse.objects.get(id=new_response_id)
        self.assertTrue(new_response.is_complete)
        self.assertEqual(new_response.score, 2)
        self.assertEqual(new_response.question_responses.count(), 2)
        
    def test_submit_quiz_with_partial_correct_answers(self):
        """Test submitting a quiz with some correct and some incorrect answers"""
        self.client.force_authenticate(user=self.user)

        test_quiz = Quiz.objects.create(
            lesson=self.lesson,
            title='Test quiz',
            instructions='This is a test quiz',
            order=4,
            passing_score=2,
            feedback_config={'default': 'Good effort!'}
        )

        test_question1 = Question.objects.create(
            quiz=test_quiz,
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
        
        test_question2 = Question.objects.create(
            quiz=test_quiz,
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
            is_required=False,
            order=2
        )
        
        response_data = {
            'quiz_id': test_quiz.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': test_question1.id,
                    'response_data': {'selected': 'option_a'}  # Correct
                },
                {
                    'question_id': test_question2.id,
                    'response_data': {'selected': ['option_a', 'option_b']}  # Partially correct
                }
            ]
        }
        
        response = self.client.post(
            self.quiz_responses_url,
            data=json.dumps(response_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify score calculation - should be 1 (question1 correct, question2 incorrect)
        new_response = UserQuizResponse.objects.exclude(id=self.quiz_response.id).first()
        self.assertEqual(new_response.score, 1)
        
        # Verify individual question correctness
        q1_response = new_response.question_responses.get(question=test_question1)
        self.assertTrue(q1_response.is_correct)
        
        q2_response = new_response.question_responses.get(question=test_question2)
        self.assertFalse(q2_response.is_correct)  # Should be false since not exactly matched

    def test_feedback_based_on_score(self):
        """Test that appropriate feedback is returned based on quiz score"""
        self.client.force_authenticate(user=self.user)
        
        # Update quiz to have score-based feedback
        self.quiz.feedback_config = {
            'ranges': [
                {'min': 0, 'max': 1, 'feedback': 'Keep practicing!'},
                {'min': 2, 'max': 2, 'feedback': 'Great job!'}
            ],
            'default': 'Good attempt!'
        }
        self.quiz.save()
        
        # Submit a quiz response with a score of 1
        response_data = {
            'quiz_id': self.quiz.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.question1.id,
                    'response_data': {'selected': 'option_a'}  # Correct
                },
                {
                    'question_id': self.question2.id,
                    'response_data': {'selected': ['option_b']}  # Incorrect
                }
            ]
        }
        
        response = self.client.post(
            self.quiz_responses_url,
            data=json.dumps(response_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['feedback'], 'Keep practicing!')
        
        # Submit another response with a perfect score
        perfect_response_data = {
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
        
        response = self.client.post(
            self.quiz_responses_url,
            data=json.dumps(perfect_response_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['feedback'], 'Great job!')
        
    # TODO: Right now quizzes can only have one response, so we need a different way of tracking attempts
    #   ex. user_responses = UserQuizResponse.objects.filter(user=self.user, quiz=self.quiz).count() == 1 != 3
    # def test_multiple_attempts_tracking(self):
    #     """Test that the system tracks multiple attempts by the same user"""
    #     self.client.force_authenticate(user=self.user)
        
    #     # First attempt - low score
    #     first_attempt_data = {
    #         'quiz_id': self.quiz.id,
    #         'is_complete': True,
    #         'question_responses': [
    #             {
    #                 'question_id': self.question1.id,
    #                 'response_data': {'selected': 'option_b'}  # Incorrect
    #             }
    #         ]
    #     }
        
    #     first_response = self.client.post(
    #         self.quiz_responses_url,
    #         data=json.dumps(first_attempt_data),
    #         content_type='application/json'
    #     )
        
    #     self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
    #     first_score = first_response.data['data']['quiz_response']['score']
    #     self.assertEqual(first_score, 0)
        
    #     # Second attempt - better score
    #     second_attempt_data = {
    #         'quiz_id': self.quiz.id,
    #         'is_complete': True,
    #         'question_responses': [
    #             {
    #                 'question_id': self.question1.id,
    #                 'response_data': {'selected': 'option_a'}  # Correct
    #             },
    #             {
    #                 'question_id': self.question2.id,
    #                 'response_data': {'selected': ['option_a', 'option_c']}  # Correct
    #             }
    #         ]
    #     }
        
    #     second_response = self.client.post(
    #         self.quiz_responses_url,
    #         data=json.dumps(second_attempt_data),
    #         content_type='application/json'
    #     )
        
    #     self.assertEqual(second_response.status_code, status.HTTP_201_CREATED)
    #     second_score = second_response.data['data']['quiz_response']['score']
    #     self.assertEqual(second_score, 2)
        
    #     # Check that we have 3 responses for this user (including the one from setUp)
    #     user_responses = UserQuizResponse.objects.filter(user=self.user, quiz=self.quiz)
    #     self.assertEqual(user_responses.count(), 3)
        
    #     # Get all responses for this quiz
    #     response = self.client.get(f"{self.quiz_responses_url}?quiz_id={self.quiz.id}")
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
    #     self.assertEqual(len(response.data['data']['quiz_responses']), 3)
        
    #     # Verify we can identify the best score
    #     best_score = max(r['score'] or 0 for r in response.data['data']['quiz_responses'] if r['score'] is not None)
    #     self.assertEqual(best_score, 2)
        
    def test_quiz_completion_status(self):
        """Test that completion status is tracked correctly"""
        self.client.force_authenticate(user=self.user)
        
        # Get quiz completion status before any quiz completions
        quiz_status_url = reverse('quiz-status', args=[self.quiz_2.id])
        response = self.client.get(quiz_status_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        initial_completion = response.data['data']['completion_percentage']
        
        # Submit a complete quiz response
        response_data = {
            'quiz_id': self.quiz_2.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.question_quiz_2.id,
                    'response_data': {'selected': 'option_a'}
                },
            ]
        }
        
        self.client.post(
            self.quiz_responses_url,
            data=json.dumps(response_data),
            content_type='application/json'
        )
        
        # Check quiz completion status again
        response = self.client.get(quiz_status_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        new_completion = response.data['data']['completion_percentage']
        
        # Completion percentage should have increased
        self.assertGreater(new_completion, initial_completion)
        
    def test_bulk_quiz_responses_retrieval(self):
        """Test retrieving quiz responses for multiple quizzes"""
        self.client.force_authenticate(user=self.user)
        
        # Create another quiz and response
        another_quiz = Quiz.objects.create(
            lesson=self.lesson,
            title='Quiz 2',
            instructions='Complete this quiz',
            order=2,
            passing_score=1,
            feedback_config={'default': 'Good job!'}
        )
        
        # Create response for the new quiz
        another_response = UserQuizResponse.objects.create(
            user=self.user,
            quiz=another_quiz,
            is_complete=True,
            score=1,
            time_spent=15
        )
        
        # Get responses for both quizzes
        response = self.client.get(f"{self.quiz_responses_url}?lesson_id={self.lesson.id}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']['quiz_responses']), 2)
        quiz_ids = [r['quizId'] for r in response.data['data']['quiz_responses']]
        self.assertIn(self.quiz.id, quiz_ids)
        self.assertIn(another_quiz.id, quiz_ids)
    
    # TODO: Unimplemented
    #
    # def test_quiz_statistics(self):
    #     """Test retrieving quiz statistics (for instructors)"""
    #     # Create an instructor user
    #     instructor = User.objects.create_user(
    #         username='instructor',
    #         password='instructorpass',
    #         display_name='Instructor User'
    #     )
    #     instructor.is_staff = True
    #     instructor.save()
        
    #     self.client.force_authenticate(user=instructor)
        
    #     # Submit several responses from different users
    #     self.client.logout()
    #     self.client.force_authenticate(user=self.user)
        
    #     response_data = {
    #         'quiz_id': self.quiz.id,
    #         'is_complete': True,
    #         'question_responses': [
    #             {
    #                 'question_id': self.question1.id,
    #                 'response_data': {'selected': 'option_a'}  # Correct
    #             },
    #             {
    #                 'question_id': self.question2.id,
    #                 'response_data': {'selected': ['option_a']}  # Incorrect
    #             }
    #         ]
    #     }
        
    #     self.client.post(
    #         self.quiz_responses_url,
    #         data=json.dumps(response_data),
    #         content_type='application/json'
    #     )
        
    #     self.client.logout()
    #     self.client.force_authenticate(user=self.user3)
        
    #     self.client.post(
    #         self.quiz_responses_url,
    #         data=json.dumps(response_data),
    #         content_type='application/json'
    #     )
        
    #     # Now log back in as instructor and check statistics
    #     self.client.logout()
    #     self.client.force_authenticate(user=instructor)
        
    #     stats_url = reverse('quiz-statistics', args=[self.quiz.id])
    #     response = self.client.get(stats_url)
        
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
    #     stats = response.data['data']['statistics']
        
    #     # Check overall statistics
    #     self.assertEqual(stats['total_attempts'], 3)  # Including the one from setUp
    #     self.assertIn('average_score', stats)
    #     self.assertIn('completion_rate', stats)
        
    #     # Check question-specific statistics
    #     self.assertIn('questions', stats)
    #     self.assertEqual(len(stats['questions']), 2)
        
    #     # Check regular users cannot access statistics
    #     self.client.logout()
    #     self.client.force_authenticate(user=self.user)
    #     response = self.client.get(stats_url)
    #     self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)