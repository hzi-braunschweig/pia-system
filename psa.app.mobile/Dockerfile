FROM node:14.17.0-alpine@sha256:f07ead757c93bc5e9e79978075217851d45a5d8e5c48eaf823e7f12d9bbc1d3c AS build-browser

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
