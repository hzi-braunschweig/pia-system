# Appflow currently only supports until node v18 (https://ionic.io/docs/appflow/build-stacks)
FROM node:20.9.0-alpine@sha256:cb2301e2c5fe3165ba2616591efe53b4b6223849ac0871c138f56d5f7ae8be4b AS base

FROM base AS npm-install
RUN apk --update --no-cache add curl tzdata
RUN apk --update --no-cache add chromium ttf-dejavu ttf-liberation ttf-freefont
RUN apk --update --no-cache add bash jq
ENV CHROME_BIN=/usr/bin/chromium-browser

# required to prevent:
# could not load the shared library:dso_dlfcn.c:185:filename(libssl_conf.so): libssl_conf.so: cannot open shared object file: No such file or directory
ENV OPENSSL_CONF=/etc/ssl/

WORKDIR /usr/src/node-app/

ARG DIR=.
COPY $DIR/package*.json ./
# copy dev dependencies
COPY psa.lib.licensecollector/package*.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist
COPY psa.eslint-config/ ../psa.eslint-config/
COPY psa.lib.charts/dist ../psa.lib.charts/dist

### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /usr/src/psa.lib.licensecollector
RUN npm ci
WORKDIR /usr/src/node-app/
###

RUN npm ci

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

WORKDIR /usr/src/workdir/

# install Ionic CLI tool for appflow commands
RUN curl -fsSL https://ionic.io/get-ionic-cloud-cli | bash

################################################################

FROM base AS build-browser
RUN apk --update --no-cache add g++ make python3

RUN npm install -g cordova

USER node
WORKDIR /usr/src/node-app/

ARG DIR=.
COPY $DIR/package*.json ./
# copy dev dependencies
COPY --chown=node psa.lib.licensecollector/package*.json ../psa.lib.licensecollector/
COPY --chown=node psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist
COPY --chown=node psa.eslint-config/ ../psa.eslint-config/
COPY --chown=node psa.lib.charts/dist ../psa.lib.charts/dist

### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /usr/src/psa.lib.licensecollector
RUN npm ci
WORKDIR /usr/src/node-app/
###

RUN npm ci

COPY --chown=node $DIR/.browserslistrc $DIR/*.json $DIR/config.xml $DIR/GoogleService-Info.plist ./
COPY --chown=node $DIR/src ./src
ARG configuration=production
ARG nodeoptions
ENV NODE_OPTIONS=$nodeoptions

RUN npm run build:browser

################################################################

FROM busybox:1.36.1@sha256:3fbc632167424a6d997e74f52b878d7cc478225cffac6bc977eedfe51c7f4e79 AS final

COPY --from=build-browser /usr/src/node-app/platforms/browser/www/ /assets/browser
