#!/bin/bash
docker build -t forward-app .
docker run -v ./Forward-server:/app/backend -v ./Forward-client:/app/frontend -p 8000:8000 -p 5173:5173 forward-app