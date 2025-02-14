docker build -t forward-app .
docker run -p 8000:8000 -p 5173:5173 forward-app