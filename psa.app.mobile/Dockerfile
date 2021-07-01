FROM node:14.17.1-alpine@sha256:cc1a31b2f4a3b8e9cdc6f8dc0c39a3b946d7aa5d10a53439d960d4352b2acfc0 AS build-browser

ARG DIR=

RUN npm install -g cordova
RUN npm install -g @ionic/cli

WORKDIR /app
COPY $DIR/package*.json ./
RUN npm ci
COPY $DIR/ .

RUN npm run build:browser

FROM busybox:1.33.1@sha256:930490f97e5b921535c153e0e7110d251134cc4b72bbb8133c6a5065cc68580d

COPY --from=build-browser /app/platforms/browser/www/ /assets/browser
