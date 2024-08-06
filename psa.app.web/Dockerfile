FROM node:20.9.0-alpine@sha256:cb2301e2c5fe3165ba2616591efe53b4b6223849ac0871c138f56d5f7ae8be4b  AS base

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
#copy dev dependencies
COPY psa.lib.licensecollector/package*.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist
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

################################################################

FROM base AS build-base
RUN apk --update --no-cache add g++ make python3

USER node
WORKDIR /usr/src/node-app/

ARG DIR=.
ENV CYPRESS_INSTALL_BINARY=0
COPY $DIR/package*.json ./
#copy dev dependencies
COPY --chown=node psa.lib.licensecollector/package*.json ../psa.lib.licensecollector/
COPY --chown=node psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist
COPY --chown=node psa.lib.charts/dist ../psa.lib.charts/dist


### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /usr/src/psa.lib.licensecollector
RUN npm ci
WORKDIR /usr/src/node-app/
###


RUN npm ci

COPY --chown=node $DIR/.browserslistrc $DIR/*.json ./
COPY --chown=node $DIR/src ./src
ARG nodeoptions
ENV NODE_OPTIONS=$nodeoptions

################################################################

FROM build-base AS build-public

RUN npm run build -- --output-path=./dist/out --configuration=production-proband-app

# create the pre-compressed gzip files for faster serving
RUN find /usr/src/node-app/dist/out/ | xargs gzip -k -9

################################################################

FROM build-base AS build-admin

RUN npm run build -- --output-path=./dist/out/admin --configuration=production-admin-app

# create the pre-compressed gzip files for faster serving
RUN find /usr/src/node-app/dist/out/ | xargs gzip -k -9

################################################################

FROM nginx:1.25.3-alpine@sha256:db353d0f0c479c91bd15e01fc68ed0f33d9c4c52f3415e63332c3d0bf7a4bb77 AS final
RUN apk --update --no-cache add bash sed

ARG DIR=.

RUN rm -rf /usr/share/nginx/html/*
ENV WEBAPPSERVER_HTTP_PORT=80 DEFAULT_LANGUAGE=en-US
COPY $DIR/envsubst-on-environment.sh /docker-entrypoint.d/40-envsubst-on-environment.sh
COPY $DIR/nginx-site.conf /etc/nginx/templates/default.conf.template
COPY --from=build-public /usr/src/node-app/dist/out/ /usr/share/nginx/html
COPY --from=build-admin /usr/src/node-app/dist/out/ /usr/share/nginx/html
COPY --from=build-public /usr/src/node-app/dist/out/main*.js /usr/share/nginx/template/main.js.template
COPY --from=build-admin /usr/src/node-app/dist/out/admin/main*.js /usr/share/nginx/template/admin/main.js.template

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

