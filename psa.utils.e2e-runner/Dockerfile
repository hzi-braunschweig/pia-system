FROM cypress/included:12.10.0@sha256:67c2db9f4dc28a92bd11e2244d29b3d351fc737edf90703b6c9dd4ae9137d89b

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
