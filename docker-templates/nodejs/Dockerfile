FROM node:20.18.1-alpine@sha256:24fb6aa7020d9a20b00d6da6d1714187c45ed00d1eb4adb01395843c338b9372 AS base

RUN apk --update --no-cache add curl tzdata bash chromium ttf-dejavu ttf-liberation ttf-freefont sed
USER node
WORKDIR /usr/src/node-app/

#copy dependencies' package.json
COPY --chown=node:node psa.lib.service-core/package*.json ../psa.lib.service-core/
COPY --chown=node:node psa.lib.publicapi/package*.json ../psa.lib.publicapi/
COPY --chown=node:node psa.lib.templatepipeline/package*.json ../psa.lib.templatepipeline/
COPY --chown=node:node psa.lib.messagequeue/package*.json ../psa.lib.messagequeue/
COPY --chown=node:node psa.lib.http-clients-internal/package*.json ../psa.lib.http-clients-internal/
COPY --chown=node:node psa.lib.auth-server-client/package*.json ../psa.lib.auth-server-client/
COPY --chown=node:node psa.lib.hapi-i18n-plugin/package*.json ../psa.lib.hapi-i18n-plugin/

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
#copy dependencies' source
COPY --chown=node:node psa.lib.service-core/dist ../psa.lib.service-core/dist
COPY --chown=node:node psa.lib.publicapi/src/ ../psa.lib.publicapi/src
COPY --chown=node:node psa.lib.templatepipeline/dist ../psa.lib.templatepipeline/dist
COPY --chown=node:node psa.lib.messagequeue/dist ../psa.lib.messagequeue/dist
COPY --chown=node:node psa.lib.http-clients-internal/dist ../psa.lib.http-clients-internal/dist
COPY --chown=node:node psa.lib.auth-server-client/dist ../psa.lib.auth-server-client/dist
COPY --chown=node:node psa.lib.hapi-i18n-plugin/dist ../psa.lib.hapi-i18n-plugin/dist

################################################################

FROM base AS install-npm-build-dependencies

USER root
RUN apk --update --no-cache add g++ make python3
USER node

### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /usr/src/psa.lib.service-core
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000,mode=0775 npm ci --prefer-offline
WORKDIR /usr/src/psa.lib.templatepipeline
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000,mode=0775 npm ci --prefer-offline
WORKDIR /usr/src/psa.lib.messagequeue
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000,mode=0775 npm ci --prefer-offline
WORKDIR /usr/src/psa.lib.http-clients-internal
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000,mode=0775 npm ci --prefer-offline
WORKDIR /usr/src/psa.lib.auth-server-client
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000,mode=0775 npm ci --prefer-offline
WORKDIR /usr/src/psa.lib.hapi-i18n-plugin
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000,mode=0775 npm ci --prefer-offline

WORKDIR /usr/src/node-app/
###

################################################################

FROM install-npm-build-dependencies AS install-production

ARG DIR=.
COPY $DIR/package*.json ./

RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000,mode=0775 npm ci --omit=dev --prefer-offline

################################################################

FROM install-npm-build-dependencies AS install

#copy dev dependencies' package.json
COPY --chown=node:node psa.eslint-config/package*.json ../psa.eslint-config/

### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /usr/src/psa.eslint-config
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000,mode=0775 npm ci --prefer-offline
WORKDIR /usr/src/node-app/
###

ARG DIR=.
COPY $DIR/package*.json ./

RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000,mode=0775 npm ci --prefer-offline

#copy dev dependencies' source
COPY --chown=node:node psa.lib.service-core/tsconfig.global.json ../psa.lib.service-core/

################################################################

FROM pandoc/latex:3.7.0.2-ubuntu@sha256:b035cf4b287f0582d73e31e881e4a8816a8ca902812da93ed86f72579f0cda79 AS convert-markdown

ARG DIR=.
WORKDIR /usr/resources/

RUN --mount=type=bind,source=$DIR,target=/src/ \
    if [ -d /src/resources/ ]; then cp -R /src/resources/. .; fi

RUN if [ -e README.md ] ; then pandoc README.md pandoc-styling.yml -o README.pdf; fi

################################################################

FROM install AS npm-install

COPY --chown=node:node psa.eslint-config/*.js ../psa.eslint-config/

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

WORKDIR /usr/src/workdir/
USER root

################################################################

FROM install AS build

ARG DIR=.
RUN --mount=type=bind,source=$DIR,target=/src/ \
    cp /src/tsconfig*.json ./ && \
    find /src -name tsoa\*.json -exec cp {} ./destination \; && \
    cp -r /src/src ./src

RUN npm run build

################################################################

FROM base AS final

COPY --from=install-npm-build-dependencies /usr/src/ /usr/src/
COPY --from=install-production /usr/src/node-app/ /usr/src/node-app/
COPY --from=convert-markdown /usr/resources ./resources
COPY --from=build /usr/src/node-app/dist/src ./src

ARG VERSION_INFO_PIPELINE_ID=-
ENV VERSION_INFO_PIPELINE_ID=$VERSION_INFO_PIPELINE_ID

ARG VERSION_INFO_GIT_HASH=-
ENV VERSION_INFO_GIT_HASH=$VERSION_INFO_GIT_HASH

ARG VERSION_INFO_GIT_REF=-
ENV VERSION_INFO_GIT_REF=$VERSION_INFO_GIT_REF

ENV PORT=4000
ENV INTERNAL_PORT=5000
# since Node v15 UnhandledPromiseRejection will throw errors by default
# this line can be removed if all rejected promises are handled
ENV NODE_OPTIONS=--unhandled-rejections=warn

EXPOSE 4000

COPY --chmod=0755 psa.utils.scripts/logs-masking/custom-entrypoint.sh /custom-entrypoint.sh
ENTRYPOINT ["/custom-entrypoint.sh", "docker-entrypoint.sh"]
CMD ["npm", "start"]
