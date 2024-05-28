# psa.app.web

PIA App for browsers.

## Setup local

Install dependencies: `npm install`.

## Start App locally

- Start backend services as described in the [development documentation](../docs/development.md)
- `npm run start.proband` for proband app
- `npm run start.admin` for admin app

## Testing

### Run unit tests

`npm run test.unit`

### Run end-to-end tests

You need to create a SysAdmin user, before you can run E2E tests:

```shell
kubectl -n pia exec -it deploy/authserver -- /add-sysadmin.sh --email e2e-admin@example.com --password admin-PW-with-22-chars
```

The credentials must match the SysAdmin user, defined in the [`users.json`](cypress/fixtures/users.json) fixture.

Start tests by executing `npm run e2e`.

### Run tests in a CI-pipeline

For testing in a build-pipeline you can use these commands:

```shell script
npm run test.ci
npm run e2e.ci
```

The script `e2e.ci` expects the webapp to be already served. Set environment variable `WEBAPP_URL` to point to the running webapp.
