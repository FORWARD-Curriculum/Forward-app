FROM node:20-alpine AS development-dependencies-env

WORKDIR /app/server
COPY ./package*.json .
RUN npm install --loglevel verbose

ENV BACKEND_URL="http://backend:8000"

EXPOSE 5173

VOLUME /app/server

CMD npm run dev