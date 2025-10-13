FROM node:20.18.1-alpine@sha256:24fb6aa7020d9a20b00d6da6d1714187c45ed00d1eb4adb01395843c338b9372 AS base

######

FROM base AS packages

RUN apk add rsync

WORKDIR /src/

RUN --mount=type=bind,target=/data/ \
    cd /data/ && \
    rsync --archive --prune-empty-dirs --include='*package.json' --include='*package-lock.json' --include='*/' --include='.' --exclude='*' /data/ /src/

######

FROM base AS lerna

WORKDIR /src/

COPY --from=packages /src/ /src/

RUN npm ci

COPY lerna.json ./

RUN --mount=type=cache,target=/npm-cache/ \
    PUPPETEER_SKIP_DOWNLOAD=1 CYPRESS_INSTALL_BINARY=0 npx lerna bootstrap --ci -- --cache /npm-cache/ --prefer-offline

COPY psa.lib.licensecollector/dist psa.lib.licensecollector/dist
COPY psa.lib.licensecollector/static-licenses psa.lib.licensecollector/static-licenses
RUN npm i -g psa.lib.licensecollector/

RUN licensecollector -d -f text -t ./THIRD_PARTY_LICENSES .

######

FROM scratch AS raw

COPY --from=lerna /src/THIRD_PARTY_LICENSES /THIRD_PARTY_LICENSES

######

FROM base AS final

COPY --from=lerna /src/THIRD_PARTY_LICENSES /THIRD_PARTY_LICENSES_UPDATED
