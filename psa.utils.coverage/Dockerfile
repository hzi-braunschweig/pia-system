FROM node:14.17.0-alpine@sha256:f07ead757c93bc5e9e79978075217851d45a5d8e5c48eaf823e7f12d9bbc1d3c

RUN npm install -g nyc

WORKDIR /app

ARG DIR=

COPY $DIR/src/fix-report.js /app/src/fix-report.js
COPY $DIR/package.json /app/package.json
