# API Documentation

[Back to Main Docs](../README.md)

[Database Docs](./database-diagram.md)

## Introduction

#### All responses follow a consistent format

```json
{
  "detail": "Some message",
  "data": {
    "exampleObject": {
      "exampleField1": "content",
      "exampleField2": "more content"
    }
  }
}
```

#### For **Unauthorized** requests (no valid session/credentials):

- Status Code: 401 UNAUTHORIZED
- Default Response Body:

```json
{
  "detail": "Authentication credentials were not provided."
}
```

#### For **Forbidden** requests (authenticated but not allowed):

- Status Code: 403 FORBIDDEN
- Default Response Body:

```json
{
  "detail": "You do not have permission to perform this action."
}
```

# Endpoints

User Endpoints

- [/api/sessions/](#apisessions)
- [/api/users/](#apiusers)
- [/api/users/me/](#apiusersme)

Curriculum Endpoints

- [/api/lessons/:id/](#apilessonsid)
- [/api/lessons/:id/content/](#apilessonsidcontent)
- [/api/quizzes/:id/](#apiquizzesid)
- [/api/quizzes/:id/status/](#apiquizzesidstatus)
- [/api/quizzes/responses/](#apiquizzesresponses)
- [/api/quizzes/responses/:response_id/](#apiquizzesresponsesresponse_id)
- [/api/text_content/:id/](#apitext_contentid)
- [/api/writings/:id/](#apiwritingsid)
- [/api/polls/:id/](#apipolls_id)

## User Endpoints

### /api/sessions/

<details>
<summary>POST - Log In a User</summary>
Logs in a user with valid credentials and returns the current user's information.

- Require Authentication: false
- Request

  - Method `POST`
  - URL: /api/sessions/
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "username": "js01ca28",
      "password": "secret password"
    }
    ```

- Successful Response

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Login successful",
      "data": {
        "user": {
          "id": 1,
          "username": "js01ca28",
          "display_name": "John Smith",
          "facility_id": "94805897432092394720",
          "profile_picture": "cdn://user/1?height=100&width=100",
          "consent": false,
          "preferences": {
            "theme": "light",
            "text_size": "txt-base"
          }
        }
      }
    }
    ```

- Error Response: Invalid credentials

  - Status Code: 401
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Invalid credentials"
    }
    ```

- Error response: Body validation errors

  - Status Code: 400
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": {
        "username": "Username is required",
        "password": "Password is required"
      }
    }
    ```
</details>

<details>
<summary>DELETE - Log Out a User</summary>
Ends the current user session.

- Require Authentication: true
- Request

  - Method: DELETE
  - URL: /api/sessions/
  - Body: none

- Successful Response

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Logout successful",
      "status": 200
    }
    ```
</details>

### /api/users/

<details>
<summary>POST - Register a New User</summary>
Creates a new user, logs them in, and returns the user's information.

- Require Authentication: false
- Request

  - Method `POST`
  - URL: /api/users/
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "username": "js01ca28",
      "password": "secret password",
      "password_confirm": "secret password",
      "display_name": "John Smith",
      "facility_id": "94805897432092394720",
      "consent": false
    }
    ```

- Successful Response

  - Status Code: 201
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Registration successful",
      "data": {
        "user": {
          "id": 1,
          "username": "js01ca28",
          "display_name": "John Smith",
          "facility_id": "94805897432092394720",
          "profile_picture": null,
          "consent": false,
          "preferences": {
            "theme": "light",
            "text_size": "txt-base"
          }
        }
      }
    }
    ```

- Error response: Password validation errors

  - Status Code: 400
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": {
        "password": ["Password must be at least 8 characters long", "Password must contain at least one digit"]
      }
    }
    ```

- Error response: Passwords don't match

  - Status Code: 400
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": {
        "password": "Password fields didn't match."
      }
    }
    ```
</details>

### /api/users/me/

<details>
<summary>GET - Get Current User Information</summary>
Returns information about the currently authenticated user.

- Require Authentication: true
- Request

  - Method `GET`
  - URL: /api/users/me/
  - Headers:
    - Content-Type: application/json
  - Body: None

- Successful Response

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "data": {
        "user": {
          "id": 1,
          "username": "js01ca28",
          "display_name": "John Smith",
          "facility_id": "94805897432092394720",
          "profile_picture": "cdn://user/1?height=100&width=100",
          "consent": false,
          "preferences": {
            "theme": "light",
            "text_size": "txt-base"
          }
        }
      },
      "status": 200
    }
    ```
</details>

<details>
<summary>PATCH - Update Current User Information</summary>
Updates the current user's information.

- Require Authentication: true
- Request

  - Method `PATCH`
  - URL: /api/users/me/
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "display_name": "Jane Smith",
      "profile_picture": "https://example.com/profile.jpg",
      "consent": true,
      "theme": "dark",
      "text_size": "txt-lg"
    }
    ```

- Successful Response

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "User information updated successfully",
      "data": {
        "user": {
          "id": 1,
          "username": "js01ca28",
          "display_name": "Jane Smith",
          "facility_id": "94805897432092394720",
          "profile_picture": "https://example.com/profile.jpg",
          "consent": true,
          "preferences": {
            "theme": "dark",
            "text_size": "txt-lg"
          }
        }
      },
      "status": 200
    }
    ```

- Error response: Validation errors

  - Status Code: 400
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Failed to update user information",
      "data": {
        "theme": ["Theme is not a valid option."]
      },
      "status": 400
    }
    ```
</details>

## Curriculum Endpoints

### /api/lessons/:id/

<details>
<summary>GET - Get a Lesson by ID</summary>
Retrieves a lesson by its ID.

- Require Authentication: true
- Request

  - Method `GET`
  - URL: /api/lessons/:id
  - Body: None

- Successful Response

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "successfully found resource by given id",
      "data": {
        "id": 1,
        "title": "Introduction to College",
        "description": "Learn about the basics of college life and academics",
        "objectives": ["Understand college structures", "Learn about academic resources"],
        "order": 1,
        "tags": ["orientation", "basics"]
      }
    }
    ```

- Error Response: Lesson not found

  - Status Code: 404
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "cannot find a lesson with this id"
    }
    ```
</details>

### /api/lessons/:id/content/

<details>
<summary>GET - Get All Lesson Content</summary>
Retrieves all content associated with a lesson including text, quizzes, polls, and writing activities.

- Require Authentication: true
- Request

  - Method `GET`
  - URL: /api/lessons/:id/content
  - Body: None

- Successful Response

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Successfully retrieved lesson content",
      "data": {
        "lesson": {
          "id": 1,
          "title": "Introduction to College",
          "description": "Learn about the basics of college life and academics",
          "objectives": ["Understand college structures", "Learn about academic resources"],
          "order": 1,
          "tags": ["orientation", "basics"],
          "activities": {
            "1": {
              "id": 1,
              "lessonId": 1,
              "type": "TextContent",
              "title": "What is College?",
              "content": "College is a place where...",
              "order": 1
            },
            "2": {
              "id": 1,
              "lessonId": 1,
              "type": "Quiz",
              "title": "Basic College Knowledge",
              "instructions": "Answer the following questions",
              "order": 2,
              "passingScore": 70,
              "feedbackConfig": {
                "default": "Keep studying!",
                "ranges": [
                  {
                    "min": 0,
                    "max": 60,
                    "feedback": "You need to review the material"
                  },
                  {
                    "min": 61,
                    "max": 100,
                    "feedback": "Great job!"
                  }
                ]
              },
              "questions": [
                {
                  "id": 1,
                  "quizId": 1,
                  "questionText": "What is a college credit?",
                  "questionType": "multiple_choice",
                  "hasCorrectAnswer": true,
                  "choices": {
                    "options": [
                      {"id": "a", "text": "A type of loan"},
                      {"id": "b", "text": "A unit of academic measurement"},
                      {"id": "c", "text": "A grade level"}
                    ],
                    "correct_answers": ["b"]
                  },
                  "isRequired": true,
                  "order": 1,
                  "feedbackConfig": {
                    "correct": "Well done!",
                    "incorrect": "A credit is a unit of academic measurement."
                  }
                }
              ]
            }
          }
        }
      }
    }
    ```
</details>

### /api/quizzes/:id/

<details>
<summary>GET - Get a Quiz by ID</summary>
Retrieves a quiz by its lesson ID including all associated questions.

- Require Authentication: true
- Request

  - Method `GET`
  - URL: /api/quizzes/:id
  - Body: None

- Successful Response

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "successfully found resource by given id",
      "data": {
        "quiz": {
          "id": 1,
          "lessonId": 1,
          "type": "Quiz",
          "title": "College Knowledge Assessment",
          "instructions": "Complete all questions",
          "order": 2,
          "passingScore": 70,
          "feedbackConfig": {
            "default": "Keep studying!",
            "ranges": [
              {
                "min": 0,
                "max": 60,
                "feedback": "You need more review"
              },
              {
                "min": 61,
                "max": 100,
                "feedback": "Well done!"
              }
            ]
          }
        },
        "questions": [
          {
            "id": 1,
            "quizId": 1,
            "questionText": "What is a syllabus?",
            "questionType": "multiple_choice",
            "hasCorrectAnswer": true,
            "choices": {
              "options": [
                {"id": "a", "text": "A classroom building"},
                {"id": "b", "text": "A course outline document"},
                {"id": "c", "text": "A type of degree"}
              ],
              "correct_answers": ["b"]
            },
            "isRequired": true,
            "order": 1,
            "feedbackConfig": {
              "correct": "Correct!",
              "incorrect": "A syllabus is a document that outlines the course"
            }
          }
        ]
      }
    }
    ```

- Error Response: Quiz not found

  - Status Code: 404
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "cannot find quiz with this id"
    }
    ```
</details>

### /api/quizzes/:id/status/

<details>
<summary>GET - Get Quiz Status for Current User</summary>
Retrieves the current user's status for a specific quiz, including completion status and score.

- Require Authentication: true
- Request

  - Method `GET`
  - URL: /api/quizzes/:id/status
  - Body: None

- Successful Response (Completed Quiz)

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Retrieved quiz completion status",
      "data": {
        "quiz_id": 1,
        "is_complete": true,
        "completion_percentage": 100.0,
        "score": 80
      }
    }
    ```

- Successful Response (Not Started Quiz)

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "No response found for this quiz",
      "data": {
        "quiz_id": 1,
        "is_complete": false,
        "completion_percentage": 0.0,
        "score": null
      }
    }
    ```

- Error Response: Quiz not found

  - Status Code: 404
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Quiz not found"
    }
    ```
</details>

### /api/quizzes/responses/

<details>
<summary>POST - Submit a Quiz Response</summary>
Submits a user's responses to a quiz, with options for both complete submissions and partial saves.

- Require Authentication: true
- Request

  - Method: `POST`
  - URL: /api/quizzes/responses
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "quiz_id": 1,
      "is_complete": true,
      "question_responses": [
        {
          "question_id": 1,
          "response_data": {
            "selected": "b"
          }
        },
        {
          "question_id": 2,
          "response_data": {
            "selected": ["a", "c"]
          }
        },
        {
          "question_id": 3,
          "response_data": {
            "selected": true
          }
        }
      ]
    }
    ```

- Successful Response

  - Status Code: 201
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Quiz response submitted successfully",
      "data": {
        "quiz_response": {
          "id": 1,
          "userId": 5,
          "quizId": 1,
          "score": 2,
          "isComplete": true,
          "completion_percentage": 100.0,
          "time_spent": null,
          "questionResponses": [
            {
              "id": 1,
              "quizResponseId": 1,
              "questionId": 1,
              "responseData": {
                "selected": "b"
              },
              "isCorrect": true,
              "time_spent": null,
              "feedback": "Well done!"
            },
            {
              "id": 2,
              "quizResponseId": 1,
              "questionId": 2,
              "responseData": {
                "selected": ["a", "c"]
              },
              "isCorrect": false,
              "time_spent": null,
              "feedback": "Please review the material."
            },
            {
              "id": 3,
              "quizResponseId": 1,
              "questionId": 3,
              "responseData": {
                "selected": true
              },
              "isCorrect": true,
              "time_spent": null,
              "feedback": "Correct!"
            }
          ]
        },
        "feedback": "Well done! You scored above the passing threshold."
      }
    }
    ```

- Error Response: Missing required questions

  - Status Code: 400
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Failed to submit quiz response",
      "data": {
        "question_responses": "Missing responses for required questions: [4, 5]"
      }
    }
    ```

- Error Response: Invalid quiz ID

  - Status Code: 400
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Failed to submit quiz response",
      "data": {
        "quiz_id": "Quiz with ID 999 does not exist"
      }
    }
    ```
</details>

<details>
<summary>GET - Get User's Quiz Responses</summary>
Retrieves a list of the current user's quiz responses, optionally filtered by quiz ID.

- Require Authentication: true
- Request

  - Method: `GET`
  - URL: /api/quizzes/responses
  - Headers:
    - Content-Type: application/json
  - Query Parameters:
    - quiz_id (optional): Filter by quiz ID

- Successful Response

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Quiz responses retrieved successfully",
      "data": {
        "quiz_responses": [
          {
            "id": 1,
            "userId": 5,
            "quizId": 1,
            "score": 2,
            "isComplete": true,
            "completion_percentage": 100.0,
            "time_spent": null,
            "questionResponses": [
              {
                "id": 1,
                "quizResponseId": 1,
                "questionId": 1,
                "responseData": {
                  "selected": "b"
                },
                "isCorrect": true,
                "time_spent": null,
                "feedback": "Well done!"
              },
              {
                "id": 2,
                "quizResponseId": 1,
                "questionId": 2,
                "responseData": {
                  "selected": ["a", "c"]
                },
                "isCorrect": false,
                "time_spent": null,
                "feedback": "Please review the material."
              }
            ]
          }
        ]
      }
    }
    ```
</details>

### /api/quizzes/responses/:response_id/

<details>
<summary>GET - Get Quiz Response Details</summary>
Retrieves detailed information about a specific quiz response.

- Require Authentication: true
- Request

  - Method: `GET`
  - URL: /api/quizzes/responses/:response_id
  - Headers:
    - Content-Type: application/json

- Successful Response

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Quiz response details retrieved successfully",
      "data": {
        "quiz_response": {
          "id": 1,
          "userId": 5,
          "quizId": 1,
          "score": 2,
          "isComplete": true,
          "completion_percentage": 100.0,
          "time_spent": null,
          "questionResponses": [
            {
              "id": 1,
              "quizResponseId": 1,
              "questionId": 1,
              "responseData": {
                "selected": "b"
              },
              "isCorrect": true,
              "time_spent": null,
              "feedback": "Well done!"
            },
            {
              "id": 2,
              "quizResponseId": 1,
              "questionId": 2,
              "responseData": {
                "selected": ["a", "c"]
              },
              "isCorrect": false,
              "time_spent": null,
              "feedback": "Please review the material."
            }
          ]
        }
      }
    }
    ```

- Error Response: Quiz response not found

  - Status Code: 404
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "Quiz response with ID 999 not found"
    }
    ```
</details>

### /api/text_content/:id/

<details>
<summary>GET - Get Text Content by Lesson ID</summary>
Retrieves text content associated with a lesson.

- Require Authentication: true
- Request

  - Method `GET`
  - URL: /api/text_content/:id
  - Body: None

- Successful Response

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "successfully found resource by given id",
      "data": [
        {
          "id": 1,
          "lessonId": 1,
          "type": "TextContent",
          "title": "Introduction to College Life",
          "content": "College life is characterized by...",
          "order": 1
        },
        {
          "id": 2,
          "lessonId": 1,
          "type": "TextContent",
          "title": "Academic Resources",
          "content": "Here are some resources you should know about...",
          "order": 2
        }
      ]
    }
    ```

- Error Response: Text content not found

  - Status Code: 404
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "cannot find text content with this lesson id"
    }
    ```
</details>

### /api/writings/:id/

<details>
<summary>GET - Get Writing Activities by Lesson ID</summary>
Retrieves writing activities associated with a lesson.

- Require Authentication: true
- Request

  - Method `GET`
  - URL: /api/writings/:id
  - Body: None

- Successful Response

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "successfully found resource by given id",
      "data": [
        {
          "id": 1,
          "lessonId": 1,
          "type": "Writing",
          "title": "Reflect on College Expectations",
          "instructions": "Write a short paragraph about your expectations for college",
          "order": 3,
          "prompts": [
            "What do you hope to learn?",
            "What challenges do you anticipate?"
          ]
        }
      ]
    }
    ```

- Error Response: Writing activity not found

  - Status Code: 404
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "cannot find writing activity with this lesson id"
    }
    ```
</details>

### /api/polls/:id/

<details>
<summary>GET - Get Poll by Lesson ID</summary>
Retrieves a poll associated with a lesson including all poll questions.

- Require Authentication: true
- Request

  - Method `GET`
  - URL: /api/polls/:id
  - Body: None

- Successful Response

  - Status Code: 200
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "successfully found resource by given id",
      "data": {
        "poll": {
          "id": 1,
          "lessonId": 1,
          "type": "Poll",
          "title": "Your College Plans",
          "instructions": "Answer the following questions about your college plans",
          "order": 4,
          "config": {
            "show_results": true
          }
        },
        "pollQuestions": [
          {
            "id": 1,
            "pollId": 1,
            "questionText": "What are your academic goals?",
            "options": [
              "Transfer to a 4-year university",
              "Complete an associate's degree",
              "Learn job skills",
              "Personal enrichment"
            ],
            "allowMultiple": true,
            "order": 1
          }
        ]
      }
    }
    ```

- Error Response: Poll not found

  - Status Code: 404
  - Headers:
    - Content-Type: application/json
  - Body:

    ```json
    {
      "detail": "cannot find poll with this lesson id"
    }
    ```
</details>