FROM node:14.17.3-alpine@sha256:fb6cb918cc72869bd625940f42a7d8ae035c4e786d08187b94e8b91c6a534dfd AS base

FROM base AS npm-install
RUN apk --update --no-cache add curl tzdata
RUN apk --update --no-cache add chromium ttf-dejavu ttf-liberation ttf-freefont
ENV CHROME_BIN=/usr/bin/chromium-browser

# required to prevent:
# could not load the shared library:dso_dlfcn.c:185:filename(libssl_conf.so): libssl_conf.so: cannot open shared object file: No such file or directory
ENV OPENSSL_CONF=/etc/ssl/

WORKDIR /usr/src/node-app/

ARG DIR=.
COPY $DIR/package*.json ./
#copy dev dependencies
COPY psa.lib.licensecollector/package.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

RUN npm ci

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

WORKDIR /usr/src/workdir/

################################################################

FROM base AS build-browser
RUN npm install -g cordova @ionic/cli

USER node
WORKDIR /usr/src/node-app/

ARG DIR=.
COPY $DIR/package*.json ./
#copy dev dependencies
COPY --chown=node psa.lib.licensecollector/package.json ../psa.lib.licensecollector/
COPY --chown=node psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

RUN npm ci

COPY --chown=node $DIR/browserslist $DIR/*.json $DIR/config.xml $DIR/GoogleService-Info.plist ./
COPY --chown=node $DIR/src ./src
ARG configuration=production
ARG nodeoptions
ENV NODE_OPTIONS=$nodeoptions

RUN npm run build:browser

################################################################

FROM busybox:1.33.1@sha256:0f354ec1728d9ff32edcd7d1b8bbdfc798277ad36120dc3dc683be44524c8b60 AS final

COPY --from=build-browser /usr/src/node-app/platforms/browser/www/ /assets/browser
