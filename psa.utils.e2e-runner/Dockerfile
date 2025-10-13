FROM cypress/included:15.3.0@sha256:bcc9add4c54d0cf8165c0f3310737d86da6fb6ce6c33a314fd5e902fbf1f6c99

ENV DIR=psa.app.web

WORKDIR /dependencies/$DIR/
COPY $DIR/package*.json ./
COPY psa.lib.licensecollector/package*.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist
COPY psa.lib.licensecollector/static-licenses ../psa.lib.licensecollector/static-licenses

### workaround for npm 9 until we move to package registry
### execute install in the local dependency folders
WORKDIR /dependencies/psa.lib.licensecollector
RUN npm ci
WORKDIR /dependencies/$DIR/
###

RUN npm ci

ENV NODE_PATH=/dependencies/$DIR/node_modules
ENV PATH=$PATH:/dependencies/$DIR/node_modules/.bin

# use bash as default shell
# otherwise we will get "sh: 1: set: Illegal option -o pipefail" on gitlab-ci
RUN ln -snf /bin/bash /bin/sh
