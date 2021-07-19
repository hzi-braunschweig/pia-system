FROM cypress/included:7.6.0@sha256:62979cac102526de84da46d124f8a39dc7fdfed9919840dfd6e077f8c1da5186

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
