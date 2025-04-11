FROM python:3

# Install required packages for venv creation
RUN apt-get update && apt-get install -y python3-venv

WORKDIR /app/server
COPY ./setup_dev.sh ./

EXPOSE 8000
VOLUME /app/server

CMD /bin/bash setup_dev.sh .venv/bin/python manage.py runserver 0.0.0.0:8000
