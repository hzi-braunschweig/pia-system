FROM node:14.19.0-alpine@sha256:9a2aa545388a135b496bd55cef2be920b96c4526c99c140170e05a8de3fce653 AS npm-install

RUN apk --update --no-cache add chromium ttf-dejavu ttf-liberation ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

ARG DIR=.
WORKDIR /usr/src/node-app/
COPY $DIR/package*.json ./

COPY psa.eslint-config/package*.json psa.eslint-config/*.js ../psa.eslint-config/
COPY psa.lib.service-core/package*.json psa.lib.service-core/tsconfig.global.json ../psa.lib.service-core/
COPY psa.lib.service-core/dist ../psa.lib.service-core/dist

RUN npm ci

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

WORKDIR /usr/src/workdir/

FROM scratch AS final

