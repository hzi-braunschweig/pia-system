FROM node:14.18.0-alpine@sha256:a9c0ee1ecc1cfc7a54ffb3db2fe8dff3c8ac7df115e607cf6c720be31f255fb1 AS npm-install

ARG DIR=.
WORKDIR /usr/src/node-app/
COPY $DIR/package*.json ./

COPY psa.eslint-config/package.json psa.eslint-config/*.js ../psa.eslint-config/

RUN npm ci

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

WORKDIR /usr/src/workdir/

FROM scratch AS final
