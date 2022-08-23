# psa.test.load

Load tests to measure the performance of specific use cases

## Installation

Load tests are written for k6 (https://k6.io). The k6 CLI needs to be installed locally for test execution.

See the official docs: <https://k6.io/docs/getting-started/installation>

## Run Tests

`USERS_FIXTURE=example.users-fixture.json URL=https://pia-app.local npm run start` executes the first test scenario against your local PIA instance.

### Environment Variables

#### URL

Is required and defines the target to run your scenario against.

### USERS_FIXTURE

Is required and defines a JSON file with username/password combination. [example.users-fixture.json](example.users-fixture.json) show the expected structure.

#### STAGES

Defaults to `dev`. Is used to set the stage configuration, simulating increasing and decreasing user access.
`dev` is only used to develop tests, as it finished quickly without minimum load on your target system.  
To learn more, take a look at the comments in configuration files at [./stages/](./stages/).

Example for running a peak test:
`USERS_FIXTURE=example.users-fixture.json URL=https://pia-app.local STAGES=peak npm run start`

## Debugging Tests

- `--verbose` outputs K6s debugging information
- `--http-debug` outputs all requests K6 is doing

Example: `USERS_FIXTURE=example.users-fixture.json URL=https://pia-app.local npm run start -- --verbose --http-debug`
