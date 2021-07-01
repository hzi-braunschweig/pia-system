FROM node:14.17.1-alpine@sha256:cc1a31b2f4a3b8e9cdc6f8dc0c39a3b946d7aa5d10a53439d960d4352b2acfc0 AS base
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

COPY --from=docker:20.10.7@sha256:bfc499cef26daa22da31b76be1752813a6921ee1fa1dd1f56d4fdf19c701d332 /usr/local/bin/docker /usr/local/bin/docker

ENV TZ=UTC

COPY --from=build /usr/src/node-app/dist/src ./src

ENV PORT 4000
EXPOSE 4000

CMD npm start
