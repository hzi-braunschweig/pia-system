FROM node:14.17.5-alpine@sha256:b8d48b515e3049d4b7e9ced6cedbe223c3bc4a3d0fd02332448f3cdb000faee1
RUN apk --no-cache add curl git bash
RUN npm install -g lerna

COPY psa.lib.licensecollector/package.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

RUN npm i -g ../psa.lib.licensecollector/

WORKDIR /usr/src/workdir/
