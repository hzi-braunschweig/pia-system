FROM cypress/included:13.3.3@sha256:713dde439a51c9370e26bc216ef18b066536714f9460b5a26f3dbaec700ce401

ENV DIR=psa.app.web

WORKDIR /dependencies/$DIR/
ENV PACT_SKIP_BINARY_INSTALL=true
COPY $DIR/package*.json ./
COPY psa.lib.licensecollector/package*.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

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
