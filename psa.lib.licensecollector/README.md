# psa.lib.licensecollector

@pia-system/licensecollector collects licenses of all NPM dependencies of a sub project to produce a license
information file.

## Installation

@pia-system/licensecollector is not yet published to any NPM registry. Thus we install it only locally:

```shell
npm install @pia-system/licensecollector@file:../psa.lib.licensecollector
```

For the CI to be able to build the dependent project with this package, you need to add it to the corresponding Docker container:

```Dockerfile
FROM node:20.3.0-alpine AS base

...

ARG DIR=.
COPY $DIR/package*.json ./
#copy dependencies' package.json
COPY --chown=node:node psa.lib.licensecollector/package.json ../psa.lib.licensecollector/

RUN npm ci --omit=dev
#copy dependencies' source
COPY --chown=node:node psa.lib.licensecollector/dist ../psa.lib.licensecollector/dist
```

## Usage

For usage hints please consult the CLI documentation or have a look into the usage in psa.app.mobile or psa.app.web.

## Linting

For linting the source code of this lib we currently cannot use the psa.eslint-config. Usage of this lib produces
peer dependency errors which cannot be resolved by NPM.

psa.app.mobile relies on @pia-system/licensecollector and is build on Ionic Appflow. The later executes a `npm ls`
command, which runs into an error, if peer dependencies cannot be resolved. Thus, the mobile app build fails.
Not relying on psa.eslint-config is currently the solution with the least negative effect on the overall code base.
The effect is, that the eslint config for @pia-system/licensecollector is not shared with other sub projects within
this repository. This may change as soon as NPM version >= 8.8.0 is used or internal libs will be published to a
NPM registry.
