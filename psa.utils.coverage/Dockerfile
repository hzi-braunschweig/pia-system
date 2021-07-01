FROM node:14.17.1-alpine@sha256:cc1a31b2f4a3b8e9cdc6f8dc0c39a3b946d7aa5d10a53439d960d4352b2acfc0

RUN npm install -g nyc

WORKDIR /app

ARG DIR=

COPY $DIR/src/fix-report.js /app/src/fix-report.js
COPY $DIR/package.json /app/package.json
