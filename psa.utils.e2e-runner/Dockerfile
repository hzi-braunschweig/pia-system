FROM cypress/included:8.6.0@sha256:021f2017118ded2210359e2355f1c38ccaa0942d524b9bfac172df4bf315aa58

ENV DIR=psa.app.web

WORKDIR /dependencies/$DIR/
ENV PACT_SKIP_BINARY_INSTALL=true
COPY $DIR/package*.json ./
COPY psa.lib.licensecollector/package.json ../psa.lib.licensecollector/
COPY psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist

RUN npm ci

ENV NODE_PATH=/dependencies/$DIR/node_modules
ENV PATH=$PATH:/dependencies/$DIR/node_modules/.bin

# use bash as default shell
# otherwise we will get "sh: 1: set: Illegal option -o pipefail" on gitlab-ci
RUN ln -snf /bin/bash /bin/sh
