FROM node:14.17.3-alpine@sha256:fb6cb918cc72869bd625940f42a7d8ae035c4e786d08187b94e8b91c6a534dfd
RUN apk --no-cache add curl git bash
RUN npm install -g lerna

COPY psa.lib.licensecollector/package.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

RUN npm i -g ../psa.lib.licensecollector/

WORKDIR /usr/src/workdir/