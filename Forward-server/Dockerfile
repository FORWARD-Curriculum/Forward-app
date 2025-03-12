FROM python:3

# Install required packages for venv creation
RUN apt-get update && apt-get install -y python3-venv

WORKDIR /app/server
COPY ./setup_dev.sh .

EXPOSE 8000
VOLUME /app/server

CMD /bin/bash /app/server/setup_dev.sh && /app/server/.venv/bin/python /app/server/manage.py runserver 0.0.0.0:8000