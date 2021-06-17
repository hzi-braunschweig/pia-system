FROM node:14.17.0-alpine@sha256:f07ead757c93bc5e9e79978075217851d45a5d8e5c48eaf823e7f12d9bbc1d3c AS base

WORKDIR /app

ARG DIR=.

COPY $DIR/package*.json ./
RUN npm ci

FROM base AS build

ARG DIR=.

COPY $DIR/tsconfig.json $DIR/tsconfig.build.json ./
COPY $DIR/src ./src

RUN npm run build

FROM base AS final

COPY --from=build /app/dist/ /app/
