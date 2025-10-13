FROM node:20.18.1-alpine@sha256:24fb6aa7020d9a20b00d6da6d1714187c45ed00d1eb4adb01395843c338b9372 AS npm-install

ARG DIR=.
WORKDIR /usr/src/node-app/
COPY $DIR/package*.json ./

COPY psa.eslint-config/package*.json psa.eslint-config/*.js ../psa.eslint-config/

### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /usr/src/psa.eslint-config
RUN npm ci
WORKDIR /usr/src/node-app/
###


RUN npm ci

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

WORKDIR /usr/src/workdir/

FROM scratch AS final

