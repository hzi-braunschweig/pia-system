FROM node:20.3.0-alpine@sha256:2d5e8a8a51bc341fd5f2eed6d91455c3a3d147e91a14298fc564b5dc519c1666 AS base
RUN apk --update --no-cache add bash sed

WORKDIR /usr/src/node-app/

ARG DIR=.
COPY $DIR/package*.json ./
#copy dependencies' package.json
COPY --chown=node:node psa.lib.service-core/package*.json ../psa.lib.service-core/

### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /usr/src/psa.lib.service-core
RUN npm ci
WORKDIR /usr/src/node-app/
###

RUN npm ci --omit=dev
#copy dependencies' source
COPY --chown=node:node psa.lib.service-core/dist ../psa.lib.service-core/dist

################################################################

FROM base AS install

#copy dev dependencies' package.json

COPY --chown=node:node psa.eslint-config/package*.json ../psa.eslint-config/

### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /usr/src/psa.eslint-config
RUN npm ci
WORKDIR /usr/src/node-app/
###

RUN npm ci

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

COPY --from=build /usr/src/node-app/dist/src/ ./src/

# for colored log output
ENV FORCE_COLOR=1

# since Node v15 UnhandledPromiseRejection will throw errors by default
# this line can be removed if all rejected promises are handled
ENV NODE_OPTIONS=--unhandled-rejections=warn

# required for gitlab ci to notice that the service is running
EXPOSE 80

COPY --chmod=0755 psa.utils.scripts/logs-masking/custom-entrypoint.sh /custom-entrypoint.sh
ENTRYPOINT ["/custom-entrypoint.sh", "docker-entrypoint.sh"]
CMD npm start
