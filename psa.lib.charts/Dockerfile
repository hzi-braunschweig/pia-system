FROM node:20.18.1-alpine@sha256:24fb6aa7020d9a20b00d6da6d1714187c45ed00d1eb4adb01395843c338b9372 AS base

FROM base AS npm-install
RUN apk --update --no-cache add curl tzdata
RUN apk --update --no-cache add chromium ttf-dejavu ttf-liberation ttf-freefont
ENV CHROME_BIN=/usr/bin/chromium-browser

# required to prevent:
# could not load the shared library:dso_dlfcn.c:185:filename(libssl_conf.so): libssl_conf.so: cannot open shared object file: No such file or directory
ENV OPENSSL_CONF=/etc/ssl/

WORKDIR /usr/src/node-app/

ARG DIR=.
ENV CYPRESS_INSTALL_BINARY=0
COPY $DIR/package*.json ./

RUN npm ci

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

WORKDIR /usr/src/workdir/
