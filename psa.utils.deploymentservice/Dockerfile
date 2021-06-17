FROM node:14.17.0-alpine@sha256:f07ead757c93bc5e9e79978075217851d45a5d8e5c48eaf823e7f12d9bbc1d3c AS base
RUN apk --update --no-cache add curl tzdata
RUN apk --update --no-cache add postgresql-client

WORKDIR /usr/src/node-app/

ARG DIR=.
COPY $DIR/package*.json ./

RUN npm ci --production

FROM base AS build

#copy dev dependencies' package.json
COPY psa.lib.service-core/package.json ../psa.lib.service-core/
COPY psa.eslint-config/package.json ../psa.eslint-config/

RUN npm ci

#copy dev dependencies' source
COPY psa.lib.service-core/tsconfig.global.json ../psa.lib.service-core/
COPY psa.lib.service-core/dist ../psa.lib.service-core/dist

COPY $DIR/tsconfig*.json ./
COPY $DIR/src ./src
RUN npm run build

FROM base AS final

COPY --from=docker:20.10.7@sha256:7a49f42626fed01146792e5add6e48e2c9f1eb3550a6840356757e55cc36ba25 /usr/local/bin/docker /usr/local/bin/docker

ENV TZ=UTC

COPY --from=build /usr/src/node-app/dist/src ./src

ENV PORT 4000
EXPOSE 4000

CMD npm start
