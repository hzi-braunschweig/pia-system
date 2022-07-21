FROM node:14.19.0-alpine@sha256:9a2aa545388a135b496bd55cef2be920b96c4526c99c140170e05a8de3fce653 AS base

WORKDIR /usr/src/node-app/

ARG DIR=.
COPY $DIR/package*.json ./
#copy dependencies' package.json
COPY --chown=node:node psa.lib.service-core/package*.json ../psa.lib.service-core/

RUN npm ci --production
#copy dependencies' source
COPY --chown=node:node psa.lib.service-core/dist ../psa.lib.service-core/dist

################################################################

FROM base AS install

#copy dev dependencies' package.json
COPY --chown=node:node psa.eslint-config/package*.json ../psa.eslint-config/

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

# required for gitlab ci to notice that the service is running
EXPOSE 80

CMD npm start
