FROM node:14.17.1-alpine@sha256:cc1a31b2f4a3b8e9cdc6f8dc0c39a3b946d7aa5d10a53439d960d4352b2acfc0 AS base

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
