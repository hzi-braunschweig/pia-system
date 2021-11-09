FROM node:14.18.1-alpine@sha256:a251de4db0e0632446c0ba62adbe1e37ff148a53732e4574d2ed0f5462cc4407 AS npm-install

ARG DIR=.
WORKDIR /usr/src/node-app/
COPY $DIR/package*.json ./

COPY psa.eslint-config/package.json psa.eslint-config/*.js ../psa.eslint-config/
COPY psa.lib.licensecollector/package.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

RUN npm ci

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

WORKDIR /usr/src/workdir/

FROM scratch AS final
