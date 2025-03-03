# API Documentation
[Back to Main Docs](../README.md)

[Database Docs](./database-diagram.md)

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

* Status Code: 401 UNAUTHORIZED
* Default Response Body:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

#### For **Unauthorized** reqeusts (authenticated but forbidden):

* Status Code: 403 FORBIDDEN
* Default Response Body:
```json
{
  "detail": "You do not have permission to perform this action."
}
```

## Endpoints

### Get the Current User

Returns the information about the current user that is logged in.

* Require Authentication: **true**
* Request
  * Method: GET
  * URL: /api/users/me/
  * Body: *none*

* Response
  * Status Code: 200 OK
  * Headers:
    * Content-Type: application/json
  * Body:
    ```json
    {
      "data": {
        "user": {
          "id": 1,
          "username": "JohnSmith",
          "firstName": "John",
          "lastName": "Smith"
        }
      }
    }
    ```

### Log In a User

Logs in a current user with valid credentials and returns the current user's
information.

* Require Authentication: **false**
* Request
  * Method: POST
  * URL: /api/sessions/
  * Headers:
    * Content-Type: application/json
  * Body:

    ```json
    {
      "username": "JohnSmith",
      "password": "secret password"
    }
    ```

* Response
  * Status Code: 200 OK
  * Headers:
    * Content-Type: application/json
  * Body:
    ```json
    {
      "detail": "Login successful",
      "data": {
        "user": {
          "id": 1,
          "username": "JohnSmith",
          "firstName": "John",
          "lastName": "Smith"
        }
      }
    }
    ```

* Error Response: Invalid credentials
  * Status Code: 401 UNAUTHORIZED
  * Headers:
    * Content-Type: application/json
  * Body:
    ```json
    {
      "detail": "Invalid credentials"
    }
    ```

* Error response: Body validation errors
  * Status Code: 400 BAD_REQUEST
  * Headers:
    * Content-Type: application/json
  * Body:

    ```json
    {
      "detail": "Both username and password are required."
    }
    ```

### Log out a user

Logs out the current user by terminating the session.

* Require Authentication: **true**
* Request
  * Method: DELETE
  * URL: /api/sessions/
  * Headers:
    * Content-Type: application/json
  * Body: *none*

* Response
  * Status Code: 200 OK
  * Headers:
    * Content-Type: application/json
  * Body:
  ```json
  {
    "detail": "Logout successful"
  }
  ```

### Sign Up a User

Creates a new user, logs them in as the current user, and returns the current
user's information.

* Require Authentication: **false**
* Request
  * Method: POST
  * URL: /api/users/
  * Headers:
    * Content-Type: application/json
  * Body:
    ```json
    {
      "username": "JohnSmith",
      "password": "secret password",
      "password_confirm": "secret password",
      "display_name": "John",
      "facility_id": "234"
    }
    ```

* Response
  * Status Code: 201 CREATED
  * Headers:
    * Content-Type: application/json
  * Body:
    ```json
    {
      "detail": "Registration successful",
      "data": {
        "user": {
          "id": 1,
          "username": "JohnSmith",
          "display_name": "John",
          "facility_id": "234",
          "profile_picture": "",
          "consent":false,
        }
      }
    }
    ```

* Error response: Body validation errors
  * Status Code: 400
  * Headers:
    * Content-Type: application/json
  * Body:
    1. Missing required fields:
    ```json
    {
      "detail": {
        "username": "This field is required.",
        "password": "This field is required.",
        "password_confirm": "This field is required.",
        "display_name": "This field is required.",
        "facility_id": "This field is required."
      },
    }
    ```
    2. Password validation errors:
    ```json
    {
      "detail": {
        "password": [
          "This password is too short. It must contain at least 8 characters.",
          "This password is too common.",
          "This password is entirely numeric."
        ] 
      }
    }
    ```
    3. Passwords don't match:
    ```json
    {
      "detail": "Password fields didn't match."
    }
    ```
    4. Username already exists:
    ```json
    {
      "detail": "username: A user with that username already exists."
    }
    ```
    5. Invalid field length:
    ```json
    {
      "detail": {
        "display_name": "Ensure this field has at least 2 characters.",
      }
    }
    ```