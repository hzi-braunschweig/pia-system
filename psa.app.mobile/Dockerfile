FROM node:14.18.0-alpine@sha256:a9c0ee1ecc1cfc7a54ffb3db2fe8dff3c8ac7df115e607cf6c720be31f255fb1 AS base

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

FROM busybox:1.34.0@sha256:e8e5cca392e3cf056fcdb3093e7ac2bf83fcf28b3bcf5818fe8ae71cf360c231 AS final

COPY --from=build-browser /usr/src/node-app/platforms/browser/www/ /assets/browser
