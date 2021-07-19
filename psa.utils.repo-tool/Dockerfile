FROM node:14.17.1-alpine@sha256:21b87afa5f267e50b806f696f754b15b37b4118bb0ef722192f27ddff78d8d67 AS base

WORKDIR /usr/src/node-app/

ARG DIR=.

COPY $DIR/package*.json ./

################################################################

FROM base AS install

RUN npm ci

################################################################

FROM install AS npm-install

ENV NODE_PATH=/usr/src/node-app/node_modules
ENV PATH=$PATH:/usr/src/node-app/node_modules/.bin

WORKDIR /workdir/

################################################################

FROM install AS build

COPY $DIR/tsconfig.json $DIR/tsconfig.build.json ./
COPY $DIR/src ./src

RUN npm run build

################################################################

FROM base AS final

RUN npm ci --production

COPY --from=build /usr/src/node-app/dist/ /usr/src/node-app/dist/
