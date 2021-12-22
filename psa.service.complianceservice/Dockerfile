FROM node:14.18.2-alpine@sha256:7bcf853eeb97a25465cb385b015606c22e926f548cbd117f85b7196df8aa0d29 AS base

RUN apk --update --no-cache add curl tzdata
RUN apk --update --no-cache add chromium ttf-dejavu ttf-liberation ttf-freefont

USER node
WORKDIR /usr/src/node-app/

ARG DIR=.
COPY $DIR/package*.json ./
#copy dependencies' package.json
COPY --chown=node:node psa.lib.service-core/package.json ../psa.lib.service-core/
COPY --chown=node:node psa.lib.templatepipeline/package.json ../psa.lib.templatepipeline/
COPY --chown=node:node psa.lib.messagequeue/package.json ../psa.lib.messagequeue/
COPY --chown=node:node psa.lib.hapi-i18n-plugin/package.json ../psa.lib.hapi-i18n-plugin/
COPY --chown=node:node psa.lib.http-clients-internal/package.json ../psa.lib.http-clients-internal/

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN npm ci --production
#copy dependencies' source
COPY --chown=node:node psa.lib.service-core/dist ../psa.lib.service-core/dist
COPY --chown=node:node psa.lib.templatepipeline/dist ../psa.lib.templatepipeline/dist
COPY --chown=node:node psa.lib.messagequeue/dist ../psa.lib.messagequeue/dist
COPY --chown=node:node psa.lib.hapi-i18n-plugin/dist ../psa.lib.hapi-i18n-plugin/dist
COPY --chown=node:node psa.lib.http-clients-internal/dist ../psa.lib.http-clients-internal/dist

################################################################

FROM base AS install

#copy dev dependencies' package.json
COPY --chown=node:node psa.eslint-config/package.json ../psa.eslint-config/

RUN npm ci

#copy dev dependencies' source
COPY --chown=node:node psa.lib.service-core/tsconfig.global.json ../psa.lib.service-core/

################################################################

FROM install AS npm-install

COPY --chown=node:node psa.eslint-config/*.js ../psa.eslint-config/

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

WORKDIR /usr/src/workdir/
USER root

################################################################

FROM install AS build

COPY $DIR/tsconfig*.json ./
COPY $DIR/src ./src
RUN npm run build

################################################################

FROM base AS final

COPY $DIR/resources ./resources
COPY --from=build /usr/src/node-app/dist/src ./src

ARG ROUTE_PREFIX=/compliance
ENV ROUTE_PREFIX=$ROUTE_PREFIX

ARG VERSION_INFO_PIPELINE_ID=-
ENV VERSION_INFO_PIPELINE_ID=$VERSION_INFO_PIPELINE_ID

ARG VERSION_INFO_GIT_HASH=-
ENV VERSION_INFO_GIT_HASH=$VERSION_INFO_GIT_HASH

ARG VERSION_INFO_GIT_REF=-
ENV VERSION_INFO_GIT_REF=$VERSION_INFO_GIT_REF

# comma separated list (1.0.0.1,8.8.8.8)
# use * to allow all ips
ARG METRICS_IP_WHITELIST=-
ENV METRICS_IP_WHITELIST=$METRICS_IP_WHITELIST

ENV PROTOCOL=https
ENV PORT=4000
ENV INTERNAL_PORT=5000
EXPOSE 4000

CMD npm start
HEALTHCHECK CMD curl -k $PROTOCOL://localhost:$PORT/metrics | grep "^up 1"
