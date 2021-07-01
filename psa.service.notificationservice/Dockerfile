FROM node:14.17.1-alpine@sha256:cc1a31b2f4a3b8e9cdc6f8dc0c39a3b946d7aa5d10a53439d960d4352b2acfc0 AS base
RUN apk --update --no-cache add curl tzdata

USER node
WORKDIR /usr/src/node-app/

ARG DIR=.
COPY $DIR/package*.json ./
#copy dependencies' package.json
COPY --chown=node:node psa.lib.service-core/package.json ../psa.lib.service-core/

RUN npm ci --production
#copy dependencies' source
COPY --chown=node:node psa.lib.service-core/dist ../psa.lib.service-core/dist

FROM base AS build

#copy dev dependencies' package.json
COPY --chown=node:node psa.eslint-config/package.json ../psa.eslint-config/

RUN npm ci

#copy dev dependencies' source
COPY --chown=node:node psa.lib.service-core/tsconfig.global.json ../psa.lib.service-core/

COPY $DIR/tsconfig*.json ./
COPY $DIR/src ./src
RUN npm run build

FROM base AS final

#COPY $DIR/resources ./resources <- other resources than .js or .ts files should be placed in this folder because tsc does not copy them into dist
COPY --from=build /usr/src/node-app/dist/src ./src

ARG ROUTE_PREFIX=/notification
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
