FROM node:14.17.3-alpine@sha256:fb6cb918cc72869bd625940f42a7d8ae035c4e786d08187b94e8b91c6a534dfd AS base

FROM base AS npm-install
RUN apk --update --no-cache add curl tzdata
RUN apk --update --no-cache add chromium ttf-dejavu ttf-liberation ttf-freefont
ENV CHROME_BIN=/usr/bin/chromium-browser

# Required packages for devDependencies (PACT)
RUN apk --no-cache add --virtual build-dependencies build-base bash wget \
    && wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub \
    && wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.33-r0/glibc-2.33-r0.apk \
    && apk add glibc-2.33-r0.apk

# required to prevent:
# could not load the shared library:dso_dlfcn.c:185:filename(libssl_conf.so): libssl_conf.so: cannot open shared object file: No such file or directory
ENV OPENSSL_CONF=/etc/ssl/

WORKDIR /usr/src/node-app/

ARG DIR=.
ENV CYPRESS_INSTALL_BINARY=0
COPY $DIR/package*.json ./
#copy dev dependencies
COPY psa.lib.licensecollector/package.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

RUN npm ci

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

WORKDIR /usr/src/workdir/

################################################################

FROM base AS build

USER node
WORKDIR /usr/src/node-app/

ARG DIR=.
ENV CYPRESS_INSTALL_BINARY=0
ENV PACT_SKIP_BINARY_INSTALL=true
COPY $DIR/package*.json ./
#copy dev dependencies
COPY --chown=node psa.lib.licensecollector/package.json ../psa.lib.licensecollector/
COPY --chown=node psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

RUN npm ci

COPY --chown=node $DIR/.browserslistrc $DIR/*.json ./
COPY --chown=node $DIR/src ./src
ARG configuration=production
ARG nodeoptions
ENV NODE_OPTIONS=$nodeoptions

RUN npm run build -- --outputPath=./dist/out --configuration $configuration

# create the pre-compressed gzip files for faster serving
RUN find /usr/src/node-app/dist/out/ | xargs gzip -k -9

################################################################

FROM nginx:1.21.1-alpine@sha256:2c2dfbb9814318bc50578b5c60a1e3305f2ac217879a1c87a84418f5d9418ff6 AS final

ARG DIR=.

RUN rm -rf /usr/share/nginx/html/*
ENV WEBAPPSERVER_HTTP_PORT=80 WEBAPPSERVER_HTTPS_PORT=443 DEFAULT_LANGUAGE=en-US
COPY $DIR/envsubst-on-environment.sh /docker-entrypoint.d/40-envsubst-on-environment.sh
COPY $DIR/nginx-site.conf /etc/nginx/templates/default.conf.template
COPY --from=build /usr/src/node-app/dist/out/ /usr/share/nginx/html
COPY --from=build /usr/src/node-app/dist/out/main*.js /usr/share/nginx/template/main.js.template

ARG VERSION_INFO_PIPELINE_ID=-
ENV VERSION_INFO_PIPELINE_ID=$VERSION_INFO_PIPELINE_ID

ARG VERSION_INFO_GIT_HASH=-
ENV VERSION_INFO_GIT_HASH=$VERSION_INFO_GIT_HASH

ARG VERSION_INFO_GIT_REF=-
ENV VERSION_INFO_GIT_REF=$VERSION_INFO_GIT_REF

RUN echo "{\"PIPELINE_ID\":\"$VERSION_INFO_PIPELINE_ID\",\"GIT_HASH\":\"$VERSION_INFO_GIT_HASH\",\"GIT_REF\":\"$VERSION_INFO_GIT_REF\"}" > /usr/share/nginx/html/version

HEALTHCHECK CMD curl -k https://localhost:$WEBAPPSERVER_HTTPS_PORT
