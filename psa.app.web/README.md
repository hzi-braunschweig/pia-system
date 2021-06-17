# psa.app.web

PIA App for Browser

## Setup local

- Install all dependencies `npm install`

## Start App locally

Before you start App

- run `./start.sh` in **pia-ansible/local**
- `npm run start`

## Testing

### Run unit tests

`npm run test.unit`

### Run end-to-end tests

`npm run e2e`

### Run tests in a CI-pipeline

For testing in a build-pipeline you can use these commands:

```shell script
npm run test.ci
npm run e2e.ci
```

The e2e.ci expect the webapp to be already served. The URL has to be set in the env variable `$WEBAPP_URL`.
