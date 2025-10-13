FROM node:20.18.1-alpine@sha256:24fb6aa7020d9a20b00d6da6d1714187c45ed00d1eb4adb01395843c338b9372

RUN npm install -g nyc

WORKDIR /app

ARG DIR=

COPY $DIR/src/fix-report.js /app/src/fix-report.js
COPY $DIR/package.json /app/package.json
