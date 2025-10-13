FROM node:20.18.1-alpine@sha256:24fb6aa7020d9a20b00d6da6d1714187c45ed00d1eb4adb01395843c338b9372 AS base

WORKDIR /usr/src/node-app/

COPY psa.eslint-config/package*.json psa.eslint-config/*.js ../psa.eslint-config/

### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /usr/src/psa.eslint-config
RUN npm ci
WORKDIR /usr/src/node-app/
###

ARG DIR=k8s
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

ARG DIR=k8s
COPY $DIR/src/ ./src/
COPY $DIR/cdk8s.yaml $DIR/jest.config.js $DIR/tsconfig.json ./

RUN npm run build

################################################################

FROM base AS final

COPY --from=install-production /usr/src/ /usr/src/
COPY --from=build /usr/src/node-app/dist/ ./dist/

ENTRYPOINT ["node", "dist/index.js"]
