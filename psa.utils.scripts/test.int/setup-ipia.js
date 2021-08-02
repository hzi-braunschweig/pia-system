/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const random = require('../test.common/random');
const env = require('../test.common/env');

const setupIpia = {
  configure: function ({ registry }) {
    const config = {
      postgresContainer: 'pia-postgres-ipia-test.int',
      postgresImageBase: `${registry}/pia/psa.database.ipia:test.int-base`,
      postgresImage: `${registry}/pia/psa.database.ipia:test.int`,
      postgresPath: '../psa.database.ipia',
      postgresSecretsPath: '../psa.utils.scripts/secrets-dockerfile',
      dbUser: 'user_' + random.createRandomString(16),
      dbPassword: random.createRandomString(16),
      dbName: random.createRandomString(16),
      dbPort: 15433,

      dbPersonaldataUser: 'user_' + random.createRandomString(16),
      dbPersonaldataPassword: random.createRandomString(16),
      dbPersonaldataName: random.createRandomString(16),
    };

    // In beforeAll it is too late to set the process.env, so we need to do everything sync!
    config.env = env.read(process.env.DOTENV_CONFIG_PATH);

    // Set our ipia variables
    config.env.DB_PERSONALDATA_HOST = 'localhost';
    config.env.DB_PERSONALDATA_PORT = config.dbPort.toString();
    config.env.DB_PERSONALDATA_USER = config.dbPersonaldataUser;
    config.env.DB_PERSONALDATA_PASSWORD = config.dbPersonaldataPassword;
    config.env.DB_PERSONALDATA_DB = config.dbName;
    config.env.DB_PERSONALDATA_ACCEPT_UNAUTHORIZED = 'true';

    env.update(config.env);

    return config;
  },
};

module.exports = setupIpia;
