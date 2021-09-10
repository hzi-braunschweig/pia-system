FROM node:14.17.5-alpine@sha256:b8d48b515e3049d4b7e9ced6cedbe223c3bc4a3d0fd02332448f3cdb000faee1 AS base

RUN apk --update --no-cache add curl tzdata
RUN apk --update --no-cache add postgresql-client

WORKDIR /usr/src/node-app/

ARG DIR=.
COPY $DIR/package*.json ./

RUN npm ci --production

################################################################

FROM base AS install

#copy dev dependencies' package.json
COPY psa.lib.service-core/package.json ../psa.lib.service-core/
COPY psa.eslint-config/package.json ../psa.eslint-config/

RUN npm ci

#copy dev dependencies' source
COPY psa.lib.service-core/tsconfig.global.json ../psa.lib.service-core/
COPY psa.lib.service-core/dist ../psa.lib.service-core/dist

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

COPY --from=docker:20.10.8@sha256:ddf0d732dcbc3e2087836e06e50cc97e21bfb002a49c7d0fe767f6c31e01d65f /usr/local/bin/docker /usr/local/bin/docker

ENV TZ=UTC

COPY --from=build /usr/src/node-app/dist/src ./src

ENV PORT 4000
EXPOSE 4000

CMD npm start
