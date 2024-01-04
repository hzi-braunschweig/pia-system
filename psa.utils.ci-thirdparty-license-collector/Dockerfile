FROM node:20.10.0-alpine@sha256:5ffaaf1eed5668f16f2d59130993b6b4e91263ea73d7556e44faa341d7d1c78a
RUN apk --no-cache add curl git bash
SHELL ["/bin/bash", "-c"]
RUN sleep 5

RUN npm install -g lerna@6.6.2

COPY psa.lib.licensecollector/package*.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

RUN npm i -g ../psa.lib.licensecollector/

WORKDIR /usr/src/workdir/
