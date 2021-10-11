FROM node:14.18.0-alpine@sha256:a9c0ee1ecc1cfc7a54ffb3db2fe8dff3c8ac7df115e607cf6c720be31f255fb1

RUN npm install -g nyc

WORKDIR /app

ARG DIR=

COPY $DIR/src/fix-report.js /app/src/fix-report.js
COPY $DIR/package.json /app/package.json
