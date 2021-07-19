FROM node:14.17.1-alpine@sha256:21b87afa5f267e50b806f696f754b15b37b4118bb0ef722192f27ddff78d8d67 AS base

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
RUN npm ci

COPY --chown=node $DIR/browserslist $DIR/*.json $DIR/config.xml $DIR/GoogleService-Info.plist ./
COPY --chown=node $DIR/licenses ./licenses
COPY --chown=node $DIR/src ./src
ARG configuration=production
ARG nodeoptions
ENV NODE_OPTIONS=$nodeoptions

RUN npm run build:browser

################################################################

FROM busybox:1.33.1@sha256:930490f97e5b921535c153e0e7110d251134cc4b72bbb8133c6a5065cc68580d AS final

COPY --from=build-browser /usr/src/node-app/platforms/browser/www/ /assets/browser
