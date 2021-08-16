FROM node:14.17.4-alpine@sha256:0c80f9449d2690eef49aad35eeb42ed9f9bbe2742cd4e9766a7be3a1aae2a310
RUN apk --no-cache add curl git bash
RUN npm install -g lerna

COPY psa.lib.licensecollector/package.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

RUN npm i -g ../psa.lib.licensecollector/

WORKDIR /usr/src/workdir/
