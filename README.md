# Forward-app Backend Notes

Django backend for the Forward application.

## Endpoints
### POST `/api/users`: New user registration
#### Request format
```json
{
    "username": "your_username",
    "password": "your_password",
    "password_confirm": "your_confirmed_password",
    "first_name": "Your",
    "last_name": "Name"
}
```
#### Response format
```json
{
    "message": "User registered successfully",
    "user": {
        "id": 1,
        "username": "your_username",
        "first_name": "Your",
        "last_name": "Name"
    }
}
```

### POST `/api/sessions`: User login
#### Request format
```json
{
    "username": "your_username",
    "password": "your_password"
}
```
#### Response format
```json
{
    "message": "Login successful",
    "user": {
        "id": 1,
        "username": "your_username",
        "first_name": "Your",
        "last_name": "Name"
    }
}
```

## Project Structure
```
Forward-app/
├── api/               # API endpoints and serializers
│   ├── urls.py       
│   ├── views.py      
│   └── serializers.py
│
├── core/              # Business logic and models
│   ├── models.py    
│   └── services.py
│
├── forward/           # Project root
│   ├── settings.py    
│   └── urls.py
```

## Setup

1. Create and activate a virtual environment:
```bash
python -m venv .venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

2. Install requirements
```bash
pip install django djangorestframework
```

3. Run migrations
```bash
python manage.py migrate
```

4. Run the development server
```bash
python manage.py runserver
```
The server will be running at http://localhost:8000