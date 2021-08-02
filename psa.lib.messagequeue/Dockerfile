FROM node:14.17.3-alpine@sha256:fb6cb918cc72869bd625940f42a7d8ae035c4e786d08187b94e8b91c6a534dfd AS npm-install

ARG DIR=.
WORKDIR /usr/src/node-app/
COPY $DIR/package*.json ./

COPY psa.eslint-config/package.json psa.eslint-config/*.js ../psa.eslint-config/
COPY psa.lib.service-core/package.json psa.lib.service-core/tsconfig.global.json ../psa.lib.service-core/
COPY psa.lib.service-core/dist ../psa.lib.service-core/dist

RUN npm ci

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

WORKDIR /usr/src/workdir/

FROM scratch AS final
