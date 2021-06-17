# Setup hook

This is a setup hook for mocha that can be used for integration tests.
When used on the developer machine, it starts a clean qPia (and optionally ipia) database and stoppes it afterwards.
It injects the following environment variables: `QPIA_HOST`, `QPIA_PORT`, `QPIA_USER`, `QPIA_PASSWORD`, `QPIA_DB`, `QPIA_ACCEPT_UNAUTHORIZED=true` that are matching the database that has been started.
Additionally variables from a dotenv file can be loaded by specifying a `DOTENV_CONFIG_PATH`.
On the ci the databases are not built and started by this script because the ci is responsible in that case.

## Requirements

### qPIA

`QPIA_ACCEPT_UNAUTHORIZED` has to be implemented in the service's config:

```js
databaseservice: {
    host: getEnvVariable('QPIA_HOST'),
    port: getEnvVariable('QPIA_PORT'),
    user: getEnvVariable('QPIA_USER'),
    password: getEnvVariable('QPIA_PASSWORD'),
    database: getEnvVariable('QPIA_DB'),
    ssl: {
        rejectUnauthorized: getEnvVariable('QPIA_ACCEPT_UNAUTHORIZED', 'false') !== 'true',
        cert: ssl_certs.cert,
        key: ssl_certs.key,
        ca: ssl_certs.ca
    }
}
```

### iPIA

`IPIA_ACCEPT_UNAUTHORIZED` has to be implemented in the service's config:

```js
ipia: {
    host: getEnvVariable('IPIA_HOST'),
    port: getEnvVariable('IPIA_PORT'),
    user: getEnvVariable('IPIA_USER'),
    password: getEnvVariable('IPIA_PASSWORD'),
    database: getEnvVariable('IPIA_DB'),
    ssl: {
        rejectUnauthorized: getEnvVariable('IPIA_ACCEPT_UNAUTHORIZED', 'false') !== 'true',
        cert: ssl_certs.cert,
        key: ssl_certs.key,
        ca: ssl_certs.ca
    }
}
```

## How to use

`DOTENV_CONFIG_PATH=tests/test.env mocha --require '../psa.utils.scripts/test.int/setup.hook.js' ...`

Do not include any DB config in the .env file, as it will NOT be overwritten by the setup hook!

### Configuration

- `START_IPIA=true` needs to be passed to also spin up an iPIA DB container:
  ```
  START_IPIA=true mocha --require '../psa.utils.scripts/test.int/setup.hook.js'
  ```
- `KEEP_QPIA=true` can be specified to keep the qPIA after mocha has finished.
- `KEEP_IPIA=true` can be specified to keep the iPIA after mocha has finished.
