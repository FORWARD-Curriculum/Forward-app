# Forward App
### Useful Links
- [Client/Frontend Notes](Forward-client/README.md)
- [API Documentation](Forward-server/README.md)
- [Database Documentation](Forward-server/database-diagram.md)

## Testing
### Docker
If you have Docker installed on your system, a system agnostic testing environment is available by running:
`docker build -t forward-app . && docker run -v ./Forward-server:/app/backend -v ./Forward-client:/app/frontend -p 8000:8000 -p 5173:5173 forward-app`, or if on a UNIX based system: `./run.sh`

This docker container will automatically run a development build of the full-scale app that will live update with changes. `^C` (Ctrl-C) to exit the container.

> [!IMPORTANT]  
> Any data action taken within the context of the container, such as user registration / lesson progress, *will* reflect in your host system, this is due to the fact the folders are being mounted to the container for hot-reloading.

TODO: Seperate servers into their own dockerfiles and use a compose file, will do this when we switch to postgres

---

### Frontend
`npm run dev`
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