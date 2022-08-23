FROM node:14.19.0-alpine@sha256:9a2aa545388a135b496bd55cef2be920b96c4526c99c140170e05a8de3fce653 AS base
RUN apk --update --no-cache add curl tzdata

USER node
WORKDIR /usr/src/node-app/

ARG DIR=.
COPY $DIR/package*.json ./

#copy dependencies' package.json
COPY --chown=node:node psa.lib.service-core/package*.json ../psa.lib.service-core/
COPY --chown=node:node psa.lib.messagequeue/package*.json ../psa.lib.messagequeue/

#copy dependencies' source
COPY --chown=node:node psa.lib.service-core/dist ../psa.lib.service-core/dist
COPY --chown=node:node psa.lib.messagequeue/dist ../psa.lib.messagequeue/dist

################################################################

FROM base AS install-npm-build-dependencies

USER root
RUN apk --update --no-cache add g++ make python3
USER node

################################################################

FROM install-npm-build-dependencies AS install-production

RUN npm ci --production

################################################################

FROM install-npm-build-dependencies AS install

#copy dev dependencies' package.json
COPY --chown=node:node psa.eslint-config/package*.json ../psa.eslint-config/

RUN npm ci

#eslint needs type defintions in internal lib to correctly resolve them
RUN mkdir -p ../psa.lib.messagequeue/node_modules/@types/ && \
    cp -R node_modules/@types/amqplib ../psa.lib.messagequeue/node_modules/@types/amqplib

#copy dev dependencies' source
COPY --chown=node:node psa.lib.service-core/tsconfig.global.json ../psa.lib.service-core/

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

#COPY $DIR/resources ./resources <- other resources than .js or .ts files should be placed in this folder because tsc does not copy them into dist
COPY --from=install-production /usr/src/ /usr/src/
COPY --from=build /usr/src/node-app/dist/src ./src

# comma separated list (1.0.0.1,8.8.8.8)
# use * to allow all ips
ARG METRICS_IP_WHITELIST=-
ENV METRICS_IP_WHITELIST=$METRICS_IP_WHITELIST

ENV NODE_EXTRA_CA_CERTS=./ssl/ca.cert
ENV PROTOCOL=https
ENV PORT=4000
EXPOSE 4000

CMD npm start
HEALTHCHECK CMD curl -k $PROTOCOL://localhost:$PORT/metrics | grep "^up 1"
