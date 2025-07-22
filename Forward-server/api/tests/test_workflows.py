from api.tests import setup_django
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from core.models import (
    Lesson, Quiz, Question, 
    UserQuizResponse, UserQuestionResponse
)
import json

User = get_user_model()

class QuizResponseWorkflowTests(TestCase):
    """
    Integration test for complete quiz response workflow, including:
    1. Autosave during quiz taking
    2. Final submission
    3. Retrieving results
    """
    
    def setUp(self):
        # Create user
        self.user = User.objects.create_user(
            username='testuser',
            password='testpassword',
            display_name='Test User'
        )
        
        # Set up API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
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
            passing_score=3,
            feedback_config={'default': 'Good job!'}
        )
        
        # Create a variety of questions
        self.mc_question = Question.objects.create(
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
        
        self.ms_question = Question.objects.create(
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
        
        # URLs
        self.quiz_responses_url = reverse('quiz-responses')
        self.quiz_url = reverse('quizes', args=[self.quiz.id])
        
    def test_complete_quiz_workflow(self):
        """Test the full workflow of taking a quiz"""
        
        # Step 1: Get the quiz details
        response = self.client.get(self.quiz_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify quiz data
        quiz_data = response.data['data']['quiz']
        self.assertEqual(quiz_data['id'], self.quiz.id)
        
        # Step 2: Save the first question (autosave)
        autosave_data_1 = {
            'quiz_id': self.quiz.id,
            'is_complete': False,
            'question_responses': [
                {
                    'question_id': self.mc_question.id,
                    'response_data': {'selected': 'option_a'}  # Correct
                }
            ]
        }
        
        response = self.client.post(
            self.quiz_responses_url,
            data=json.dumps(autosave_data_1),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        quiz_response_id = response.data['data']['quiz_response']['id']
        
        # Verify it was saved as incomplete
        saved_response = UserQuizResponse.objects.get(id=quiz_response_id)
        self.assertFalse(saved_response.partial_response)
        self.assertIsNone(saved_response.score)
        
        # Step 3: Save the second question (autosave)
        autosave_data_2 = {
            'quiz_id': self.quiz.id,
            'is_complete': False,
            'question_responses': [
                {
                    'question_id': self.mc_question.id,
                    'response_data': {'selected': 'option_a'}  # Correct
                },
                {
                    'question_id': self.ms_question.id,
                    'response_data': {'selected': ['option_a', 'option_c']}  # Correct
                }
            ]
        }
        
        response = self.client.post(
            self.quiz_responses_url,
            data=json.dumps(autosave_data_2),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['quiz_response']['id'], quiz_response_id)  # Same ID
        
        # Verify we now have two question responses but still incomplete
        saved_response = UserQuizResponse.objects.get(id=quiz_response_id)
        self.assertEqual(saved_response.question_responses.count(), 2)
        self.assertFalse(saved_response.partial_response)
        
        # Step 4: Final submission with all questions
        final_data = {
            'quiz_id': self.quiz.id,
            'is_complete': True,
            'question_responses': [
                {
                    'question_id': self.mc_question.id,
                    'response_data': {'selected': 'option_a'}  # Correct
                },
                {
                    'question_id': self.ms_question.id,
                    'response_data': {'selected': ['option_a', 'option_c']}  # Correct
                },
                {
                    'question_id': self.tf_question.id,
                    'response_data': {'selected': False}  # Incorrect
                },
                {
                    'question_id': self.opinion_question.id,
                    'response_data': {'selected': 'option_b'}  # No right/wrong
                }
            ]
        }
        
        response = self.client.post(
            self.quiz_responses_url,
            data=json.dumps(final_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['quiz_response']['id'], quiz_response_id)  # Same ID
        
        # Verify completion and score
        saved_response = UserQuizResponse.objects.get(id=quiz_response_id)
        self.assertTrue(saved_response.partial_response)
        self.assertEqual(saved_response.score, 2)  # 2 correct out of 3 graded questions
        self.assertEqual(saved_response.question_responses.count(), 4)
        
        # Step 5: Get the response details
        detail_url = reverse('quiz-response-detail', args=[quiz_response_id])
        response = self.client.get(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.data['data']['quiz_response']
        
        # Verify response details
        self.assertEqual(response_data['score'], 2)
        self.assertTrue(response_data['isComplete'])
        self.assertEqual(len(response_data['questionResponses']), 4)
        
        # Verify correctness of individual questions
        for qr in response_data['questionResponses']:
            if qr['questionId'] == self.mc_question.id or qr['questionId'] == self.ms_question.id:
                self.assertTrue(qr['isCorrect'])
            elif qr['questionId'] == self.tf_question.id:
                self.assertFalse(qr['isCorrect'])
            else:  # Opinion question
                self.assertIsNone(qr['isCorrect'])