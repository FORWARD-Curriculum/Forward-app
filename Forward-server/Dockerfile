FROM python:3.11-slim

# Install required packages for venv creation
#RUN apt-get update && apt-get install -y python3-venv

WORKDIR /app/server

COPY ./requirements.txt ./
RUN pip install uv

WORKDIR /app
RUN uv venv && \
    . .venv/bin/activate && \
    uv pip install -r server/requirements.txt

EXPOSE 8000
VOLUME /app/server

WORKDIR /app/server

CMD . ../.venv/bin/activate &&\
     /bin/bash setup_dev.sh &&\
     python manage.py runserver 0.0.0.0:8000