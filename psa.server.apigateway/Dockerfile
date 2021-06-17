FROM node:14.17.0-alpine@sha256:f07ead757c93bc5e9e79978075217851d45a5d8e5c48eaf823e7f12d9bbc1d3c AS base

WORKDIR /app

ARG DIR=.
COPY $DIR/package*.json ./
#copy dependencies' package.json
COPY --chown=node:node psa.lib.service-core/package.json ../psa.lib.service-core/

RUN npm ci --production
#copy dependencies' source
COPY --chown=node:node psa.lib.service-core/dist ../psa.lib.service-core/dist

FROM base AS build

#copy dev dependencies' package.json
COPY --chown=node:node psa.eslint-config/package.json ../psa.eslint-config/

RUN npm ci

#copy dev dependencies' source
COPY --chown=node:node psa.lib.service-core/tsconfig.global.json ../psa.lib.service-core/

COPY $DIR/tsconfig*.json ./
COPY $DIR/src ./src
RUN npm run build

FROM base AS final

COPY --from=build /app/dist/src/ /app/src/

# for colored log output
ENV FORCE_COLOR=1

# required for gitlab ci to notice that the service is running
EXPOSE 80

CMD npm start
