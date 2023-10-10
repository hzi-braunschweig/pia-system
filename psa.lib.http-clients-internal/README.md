# psa.lib.http-clients-internal

@pia-system/lib-http-clients-internal contains all http clients for internal APIs.

## Installation

@pia-system/lib-http-clients-internal is not yet published to any NPM registry. Thus we install it only locally:

```shell
npm install @pia-system/lib-http-clients-internal@file:../psa.lib.http-clients-internal
```

For the CI to be able to build the dependent service with this package, you need to add it to the corresponding Docker container:

```Dockerfile
FROM node:20.3.0-alpine AS base

...

ARG DIR=.
COPY $DIR/package*.json ./
#copy dependencies' package.json
COPY --chown=node:node psa.lib.http-clients-internal/package.json ../psa.lib.http-clients-internal/

RUN npm ci --omit=dev
#copy dependencies' source
COPY --chown=node:node psa.lib.http-clients-internal/dist ../psa.lib.http-clients-internal/dist
```
