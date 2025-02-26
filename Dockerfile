# Build stage for Node.js
FROM node:20-slim AS node-builder
WORKDIR /app/Forward-client
COPY Forward-client/package*.json ./
RUN npm ci
COPY Forward-client/ .
RUN npm run build

# Build stage for Python
FROM python:3.11-slim AS python-builder
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NODE_ENV=development

WORKDIR /app

# Install only required system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first
COPY requirements.txt .
RUN python -m venv /app/.venv && \
    . /app/.venv/bin/activate &&

# Copy Python application code
COPY ./Forward-server .

# Copy built Node.js files from node-builder
COPY --from=node-builder /app/Forward-client/dist ./Forward-client/dist

# Run migrations
RUN . /app/.venv/bin/activate && python manage.py migrate

# Create start script
RUN printf '#!/bin/bash\n\
trap "exit" INT TERM\n\
trap "kill 0" EXIT\n\
source /app/.venv/bin/activate\n\
python manage.py runserver 0.0.0.0:8000 &\n\
cd /app/Forward-client && npm run dev -- --host 0.0.0.0 &\n\
wait\n' > /app/start.sh && \
chmod +x /app/start.sh

EXPOSE 8000 5173

CMD ["/bin/bash", "/app/start.sh"]