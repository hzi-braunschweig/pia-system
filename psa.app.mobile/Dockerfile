# Appflow currently only supports until node v18 (https://ionic.io/docs/appflow/build-stacks)
FROM node:20.18.1-alpine@sha256:24fb6aa7020d9a20b00d6da6d1714187c45ed00d1eb4adb01395843c338b9372 AS base

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
COPY psa.lib.licensecollector/static-licenses ../psa.lib.licensecollector/static-licenses
COPY psa.eslint-config/ ../psa.eslint-config/
COPY psa.lib.charts/dist ../psa.lib.charts/dist

### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /usr/src/psa.lib.licensecollector
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000,mode=0775 npm ci --prefer-offline
WORKDIR /usr/src/node-app/
###

RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000,mode=0775 npm ci --prefer-offline

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

WORKDIR /usr/src/workdir/

# install Ionic CLI tool for appflow commands
RUN curl -fsSL https://ionic.io/get-ionic-cloud-cli | bash

################################################################

FROM base AS build-browser
RUN apk --update --no-cache add g++ make python3

USER node
WORKDIR /usr/src/node-app/

ARG DIR=.
COPY $DIR/package*.json ./
# copy dev dependencies
COPY --chown=node psa.lib.licensecollector/package*.json ../psa.lib.licensecollector/
COPY --chown=node psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist
COPY psa.lib.licensecollector/static-licenses ../psa.lib.licensecollector/static-licenses
COPY --chown=node psa.eslint-config/ ../psa.eslint-config/
COPY --chown=node psa.lib.charts/dist ../psa.lib.charts/dist

### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /usr/src/psa.lib.licensecollector
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000,mode=0775 npm ci --prefer-offline
WORKDIR /usr/src/node-app/
###

RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000,mode=0775 npm ci --prefer-offline

COPY --chown=node $DIR/.browserslistrc $DIR/*.json ./
COPY --chown=node $DIR/src ./src
ARG configuration=production
ARG nodeoptions
ENV NODE_OPTIONS=$nodeoptions

RUN npm run build:browser

################################################################

FROM busybox:1.37.0@sha256:d82f458899c9696cb26a7c02d5568f81c8c8223f8661bb2a7988b269c8b9051e AS final

COPY --from=build-browser /usr/src/node-app/www/ /assets/browser
