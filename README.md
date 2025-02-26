# Forward App
### Useful Links
- [Client/Frontend Notes](Forward-client/README.md)
- [API Documentation](Forward-server/README.md)

## Testing
### Docker
If you have Docker installed on your system, a system agnostic testing environment is available by running:
`docker build -t forward-app . && docker run -p 8000:8000 -p 5173:5173 forward-app`, or if on a UNIX based system: `./run.sh`

This docker container will automatically run a development build of the full-scale app with all files as they are at the time of running. Use `^C` (Ctrl-C) to exit the container.

> [!IMPORTANT]  
> Any data action taken within the context of the container, such as user registration / lesson progress, is volatile and will not be saved.

---

### Frontend
`cd Forward-client && npm run dev`
This will start the Frontend dev server, making it available at http://localhost:5173/

---
### Backend
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