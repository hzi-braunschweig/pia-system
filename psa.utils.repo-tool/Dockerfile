FROM node:20.3.0-alpine@sha256:2d5e8a8a51bc341fd5f2eed6d91455c3a3d147e91a14298fc564b5dc519c1666 AS base

WORKDIR /usr/src/node-app/

COPY psa.eslint-config/package*.json psa.eslint-config/*.js ../psa.eslint-config/
COPY psa.lib.licensecollector/package*.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /usr/src/psa.eslint-config
RUN npm ci
WORKDIR /usr/src/psa.lib.licensecollector
RUN npm ci
WORKDIR /usr/src/node-app/
###

ARG DIR=.
COPY $DIR/package*.json ./

################################################################

FROM base AS npm-install

RUN npm ci

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

################################################################

FROM base AS install-production

RUN npm ci --omit=dev

################################################################

FROM npm-install AS build

ARG DIR=.
COPY $DIR/src/ ./src/
COPY $DIR/tsconfig.build.json $DIR/tsconfig.json ./

RUN npm run build

################################################################

FROM base AS final

COPY --from=install-production /usr/src/ /usr/src/
COPY --from=build /usr/src/node-app/dist/ ./dist/

ENTRYPOINT ["node", "dist/index.js"]
