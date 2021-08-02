FROM node:14.17.3-alpine@sha256:fb6cb918cc72869bd625940f42a7d8ae035c4e786d08187b94e8b91c6a534dfd

RUN npm install -g nyc

WORKDIR /app

ARG DIR=

COPY $DIR/src/fix-report.js /app/src/fix-report.js
COPY $DIR/package.json /app/package.json
