FROM python:3
SHELL ["/bin/bash", "-c"]

# Install required packages for venv creation
RUN apt-get update && apt-get install -y python3-venv

WORKDIR /app/server
COPY ./setup_dev.sh ./
COPY ./requirements.txt ./

EXPOSE 8000
VOLUME /app/server

# essentially the same as running most of setup_dev.sh but in the build context
RUN python -m venv .venv
RUN source .venv/bin/activate
RUN pip install -r requirements.txt

CMD .venv/bin/python manage.py migrate\
&& .venv/bin/python manage.py seed_lessons_data --reset lesson_seed_data/lesson1.json\
&& .venv/bin/python manage.py runserver 0.0.0.0:8000
