# test.common

## docker.js

Exposes an API to interact with the local Docker daemon.
It is used by the integration test hooks to spin up a postgres container for the tests.
Do not use this directly.
It will be used by integration tests.

## env.js

Reads a local .env file and updates the process.env variables in order to prepare
the config for a testing environment.
Do not use this directly.
It will be used by integration tests.

## random.js

Generates random strings of given length.

## secret.js

Creates **weak** secrets for tests.
Do not use this directly.
It will be used by unit/integration/api tests.

## setup-db.js

Actually spins up a postgres container for the tests by utilizing docker.js
Do not use this directly.
It will be used by integration tests.
