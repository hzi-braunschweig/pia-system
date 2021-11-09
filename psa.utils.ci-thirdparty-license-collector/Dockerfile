FROM node:14.18.1-alpine@sha256:a251de4db0e0632446c0ba62adbe1e37ff148a53732e4574d2ed0f5462cc4407
RUN apk --no-cache add curl git bash
RUN npm install -g lerna

COPY psa.lib.licensecollector/package.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

RUN npm i -g ../psa.lib.licensecollector/

WORKDIR /usr/src/workdir/
