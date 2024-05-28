FROM node:20.10.0-alpine@sha256:5ffaaf1eed5668f16f2d59130993b6b4e91263ea73d7556e44faa341d7d1c78a AS base

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
RUN npm i -g psa.lib.licensecollector/

RUN licensecollector -d -f text -t ./THIRD_PARTY_LICENSES .

######

FROM scratch AS raw

COPY --from=lerna /src/THIRD_PARTY_LICENSES /THIRD_PARTY_LICENSES

######

FROM base AS final

COPY --from=lerna /src/THIRD_PARTY_LICENSES /THIRD_PARTY_LICENSES_UPDATED
