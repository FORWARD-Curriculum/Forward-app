FROM node:alpine

# Install required packages
RUN apk add --no-cache --update \
    bash \
    python3 \
    py3-pip \
    py3-virtualenv \
    ca-certificates

# Setup frontend
WORKDIR /app/frontend
COPY Forward-client/package*.json ./
# Either ensure package-lock.json exists, or use npm install instead of npm ci
RUN npm install

# Setup backend (move virtual environment outside the mounted directory)
WORKDIR /app/backend
RUN python3 -m venv /venv
RUN /venv/bin/pip install django djangorestframework

# Create entrypoint script
RUN printf '#!/bin/bash\n\
source /venv/bin/activate\n\
/venv/bin/python /app/backend/manage.py migrate\n\
trap "exit" INT TERM\n\
trap "kill 0" EXIT\n\
/venv/bin/python /app/backend/manage.py runserver 0.0.0.0:8000 &\n\
cd /app/frontend && npm install && npm run dev -- --host 0.0.0.0 &\n\
wait\n' > /app/start.sh && \
chmod +x /app/start.sh

EXPOSE 8000 5173

# Mount only the source code; ensure the virtual environment is not overwritten
VOLUME /app/frontend /app/backend

CMD ["/bin/bash", "/app/start.sh"]
