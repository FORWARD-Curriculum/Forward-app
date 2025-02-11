# Forward-app Backend Notes

Django backend for the Forward application.

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