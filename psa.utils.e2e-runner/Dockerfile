FROM cypress/included:7.5.0@sha256:5ee6d1865bf721e7ee2c4902dd962f9bb3b14137d3eeacca74c827854a918248

ENV DIR=psa.app.web

WORKDIR /dependencies/$DIR/
ENV PACT_SKIP_BINARY_INSTALL=true
COPY $DIR/package*.json ./

RUN npm ci

ENV NODE_PATH=/dependencies/$DIR/node_modules
ENV PATH=$PATH:/dependencies/$DIR/node_modules/.bin

# use bash as default shell
# otherwise we will get "sh: 1: set: Illegal option -o pipefail" on gitlab-ci
RUN ln -snf /bin/bash /bin/sh
