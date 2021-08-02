/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const util = require('util');
const docker = require('./docker');
const sleep = util.promisify(setTimeout);

const setupDb = {
  setup: async function ({
    postgresImageBase,
    postgresImage,
    postgresPath,
    postgresSecretsPath,
    postgresContainer,
    dbUser,
    dbPassword,
    dbName,
    dbPort,

    env,
  }) {
    console.log('building ' + postgresContainer);
    await docker.build(
      postgresImageBase,
      postgresPath,
      {},
      postgresPath + '/Dockerfile'
    );
    await docker.build(
      postgresImage,
      '..',
      {
        BASE: postgresImageBase,
        SRC_PATH: './secrets',
      },
      postgresSecretsPath + '/Dockerfile'
    );
    console.log(`setting up the postgres db to listen on port ${dbPort}`);
    await docker.rmf(postgresContainer);

    const ports = {};
    ports[dbPort] = 5432;

    env.POSTGRES_USER = dbUser;
    env.POSTGRES_PASSWORD = dbPassword;
    env.POSTGRES_DB = dbName;

    await docker.run(postgresContainer, postgresImage, env, ports);
    await this.waitForDb(postgresContainer);
    console.log(postgresContainer + ' is ready');
  },
  waitForDb: async function (containerName) {
    while (true) {
      try {
        const healthCheck =
          'PGPASSWORD=$POSTGRES_PASSWORD /usr/bin/pg_isready -U $POSTGRES_USER -h localhost -d $POSTGRES_DB';
        await docker.exec(
          containerName,
          `sh -c "${healthCheck.replace(/\$/g, '\\$')}"`
        );
        break;
      } catch (err) {
        if (err && err.stdout !== `localhost:5432 - no response\n`) {
          console.log(err);
        }
        await sleep(100);
      }
    }
  },
};

module.exports = setupDb;
