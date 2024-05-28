# psa.lib.auth-server-client

@pia-system/lib-auth-server-client contains a clients for the authserver admin API.

## Installation

@pia-system/lib-auth-server-client is not yet published to any NPM registry. Thus we install it only locally:

```shell
npm install @pia-system/lib-auth-server-client@file:../psa.lib.auth-server-client
```

For the CI to be able to build the dependent service with this package, you need to add it to the corresponding Docker container:

```Dockerfile
FROM node:20.3.0-alpine AS base

...

ARG DIR=.
COPY $DIR/package*.json ./
#copy dependencies' package.json
COPY --chown=node:node psa.lib.auth-server-client/package*.json ../psa.lib.auth-server-client/

RUN npm ci --omit=dev
#copy dependencies' source
COPY --chown=node:node psa.lib.auth-server-client/dist ../psa.lib.auth-server-client/dist
```
