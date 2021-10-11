FROM node:14.18.0-alpine@sha256:a9c0ee1ecc1cfc7a54ffb3db2fe8dff3c8ac7df115e607cf6c720be31f255fb1
RUN apk --no-cache add curl git bash
RUN npm install -g lerna

COPY psa.lib.licensecollector/package.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

RUN npm i -g ../psa.lib.licensecollector/

WORKDIR /usr/src/workdir/
