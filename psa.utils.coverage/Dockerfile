FROM node:14.18.1-alpine@sha256:a251de4db0e0632446c0ba62adbe1e37ff148a53732e4574d2ed0f5462cc4407

RUN npm install -g nyc

WORKDIR /app

ARG DIR=

COPY $DIR/src/fix-report.js /app/src/fix-report.js
COPY $DIR/package.json /app/package.json
