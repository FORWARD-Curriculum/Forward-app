# API Documentation

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
      "user": {
        "id": 1,
        "username": "JohnSmith",
        "firstName": "John",
        "lastName": "Smith"
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
      "message": "Login successful",
      "user": {
        "id": 1,
        "username": "JohnSmith",
        "firstName": "John",
        "lastName": "Smith"
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
    "message": "Logout successful"
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
      "firstName": "John",
      "lastName": "Smith"
    }
    ```

* Response
  * Status Code: 200 OK
  * Headers:
    * Content-Type: application/json
  * Body:
    ```json
    {
      "user": {
        "id": 1,
        "firstName": "John",
        "lastName": "Smith",
        "username": "JohnSmith"
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
      "username": ["This field is required."],
      "password": ["This field is required."],
      "password_confirm": ["This field is required."],
      "first_name": ["This field is required."],
      "last_name": ["This field is required."]
    }
    ```
    2. Password validation errors:
    ```json
    {
      "password": [
          "This password is too short. It must contain at least 8 characters.",
          "This password is too common.",
          "This password is entirely numeric."
      ]
    }
    ```
    3. Passwords don't match:
    ```json
    {
      "password": ["Password fields didn't match."]
    }
    ```
    4. Username already exists:
    ```json
    {
      "username": ["A user with that username already exists."]
    }
    ```
    5. Invalid field length:
    ```json
    {
      "first_name": ["Ensure this field has at least 2 characters."],
      "last_name": ["Ensure this field has at least 2 characters."]
    }
    ```