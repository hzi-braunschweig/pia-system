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

FROM nginx:1.31.2-alpine@sha256:81595dd77c2cc4ec66c6721daa3c13b6a1f7bb3a8a2cd3247a874e3bd5c39dd2 AS final
RUN apk --update --no-cache add bash sed

ARG DIR=.

RUN rm -rf /usr/share/nginx/html/*
ENV MOBILEAPPSERVER_HTTP_PORT=80 DEFAULT_LANGUAGE=en-US
COPY $DIR/envsubst-on-environment.sh /docker-entrypoint.d/40-envsubst-on-environment.sh
COPY $DIR/nginx-site.conf /etc/nginx/templates/default.conf.template
COPY --from=build-browser /usr/src/node-app/www/browser/ /usr/share/nginx/html/
COPY --from=build-browser /usr/src/node-app/www/browser/*.js /usr/share/nginx/template/

ARG VERSION_INFO_PIPELINE_ID=-
ENV VERSION_INFO_PIPELINE_ID=$VERSION_INFO_PIPELINE_ID

ARG VERSION_INFO_GIT_HASH=-
ENV VERSION_INFO_GIT_HASH=$VERSION_INFO_GIT_HASH

ARG VERSION_INFO_GIT_REF=-
ENV VERSION_INFO_GIT_REF=$VERSION_INFO_GIT_REF

RUN echo "{\"PIPELINE_ID\":\"$VERSION_INFO_PIPELINE_ID\",\"GIT_HASH\":\"$VERSION_INFO_GIT_HASH\",\"GIT_REF\":\"$VERSION_INFO_GIT_REF\"}" > /usr/share/nginx/html/version

COPY psa.utils.scripts/logs-masking/custom-entrypoint.sh /custom-entrypoint.sh
RUN chmod +x /custom-entrypoint.sh
ENTRYPOINT ["/custom-entrypoint.sh", "/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
