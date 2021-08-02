/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const random = require('../test.common/random');
const env = require('../test.common/env');

const setupEwpia = {
  configure: function ({ registry }) {
    const config = {
      postgresContainer: 'pia-postgres-ewpia-test.int',
      postgresImageBase: `${registry}/pia/psa.database.ewpia:test.int-base`,
      postgresImage: `${registry}/pia/psa.database.ewpia:test.int`,
      postgresPath: '../psa.database.ewpia',
      postgresSecretsPath: '../psa.utils.scripts/secrets-dockerfile',
      dbUser: 'user_' + random.createRandomString(16),
      dbPassword: random.createRandomString(16),
      dbName: random.createRandomString(16),
      dbPort: 15434,
    };

    // In beforeAll it is too late to set the process.env, so we need to do everything sync!
    config.env = env.read(process.env.DOTENV_CONFIG_PATH);

    // Set our qpia variables
    config.env.EWPIA_HOST = 'localhost';
    config.env.EWPIA_PORT = config.dbPort.toString();
    config.env.EWPIA_USER = config.dbUser;
    config.env.EWPIA_PASSWORD = config.dbPassword;
    config.env.EWPIA_DB = config.dbName;
    config.env.EWPIA_ACCEPT_UNAUTHORIZED = 'true';

    env.update(config.env);

    return config;
  },
};

module.exports = setupEwpia;
