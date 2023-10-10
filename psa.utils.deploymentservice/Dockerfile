FROM node:20.3.0-alpine@sha256:2d5e8a8a51bc341fd5f2eed6d91455c3a3d147e91a14298fc564b5dc519c1666 AS base

RUN apk --update --no-cache add curl tzdata
RUN apk --update --no-cache add postgresql-client

WORKDIR /usr/src/node-app/

ARG DIR=.
COPY $DIR/package*.json ./

RUN npm ci --omit=dev

################################################################

FROM base AS install

#copy dev dependencies' package.json
COPY psa.lib.service-core/package*.json ../psa.lib.service-core/
COPY psa.eslint-config/package*.json ../psa.eslint-config/

### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /usr/src/psa.lib.service-core
RUN npm ci
WORKDIR /usr/src/psa.eslint-config
RUN npm ci
WORKDIR /usr/src/node-app/
###

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

COPY --from=docker:24.0.5@sha256:b1f43c30e065966611cf5e38012fda2145bc08b01082fa102296957d77c2cb4c /usr/local/bin/docker /usr/local/bin/docker

ENV TZ=UTC

COPY --from=build /usr/src/node-app/dist/src ./src

ENV PORT 4000

# since Node v15 UnhandledPromiseRejection will throw errors by default
# this line can be removed if all rejected promises are handled
ENV NODE_OPTIONS=--unhandled-rejections=warn

EXPOSE 4000

CMD npm start
