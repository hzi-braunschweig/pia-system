/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const random = require('../test.common/random');
const env = require('../test.common/env');

const setupQpia = {
  configure: function ({ registry }) {
    const config = {
      postgresContainer: 'pia-postgres-test.int',
      postgresImageBase: `${registry}/pia/psa.database:test.int-base`,
      postgresImage: `${registry}/pia/psa.database:test.int`,
      postgresPath: '../psa.database',
      postgresSecretsPath: '../psa.utils.scripts/secrets-dockerfile',
      dbUser: 'user_' + random.createRandomString(16),
      dbPassword: random.createRandomString(16),
      dbName: random.createRandomString(16),
      dbPort: 15432,

      dbLogUser: 'log_' + random.createRandomString(16),
      dbLogPassword: random.createRandomString(16),
      dbLogName: random.createRandomString(16),

      dbSormasUser: 'sormas_' + random.createRandomString(16),
      dbSormasPassword: random.createRandomString(16),
      dbSormasName: random.createRandomString(16),

      dbFeedbackStatisticUser:
        'feedbackstatistic_' + random.createRandomString(16),
      dbFeedbackStatisticPassword: random.createRandomString(16),
      dbFeedbackStatisticName: random.createRandomString(16),
    };

    // In beforeAll it is too late to set the process.env, so we need to do everything sync!
    config.env = env.read(process.env.DOTENV_CONFIG_PATH);

    // Set our qpia variables
    config.env.QPIA_HOST = 'localhost';
    config.env.QPIA_PORT = config.dbPort.toString();
    config.env.QPIA_USER = config.dbUser;
    config.env.QPIA_PASSWORD = config.dbPassword;
    config.env.QPIA_DB = config.dbName;
    config.env.QPIA_ACCEPT_UNAUTHORIZED = 'true';

    config.env.DB_LOG_HOST = 'localhost';
    config.env.DB_LOG_PORT = config.dbPort.toString();
    config.env.DB_LOG_USER = config.dbLogUser;
    config.env.DB_LOG_PASSWORD = config.dbLogPassword;
    config.env.DB_LOG_DB = config.dbName;
    config.env.DB_LOG_ACCEPT_UNAUTHORIZED = 'true';

    config.env.DB_SORMAS_HOST = 'localhost';
    config.env.DB_SORMAS_PORT = config.dbPort.toString();
    config.env.DB_SORMAS_USER = config.dbSormasUser;
    config.env.DB_SORMAS_PASSWORD = config.dbSormasPassword;
    config.env.DB_SORMAS_DB = config.dbName;
    config.env.DB_SORMAS_ACCEPT_UNAUTHORIZED = 'true';

    config.env.DB_FEEDBACKSTATISTIC_HOST = 'localhost';
    config.env.DB_FEEDBACKSTATISTIC_PORT = config.dbPort.toString();
    config.env.DB_FEEDBACKSTATISTIC_USER = config.dbFeedbackStatisticUser;
    config.env.DB_FEEDBACKSTATISTIC_PASSWORD =
      config.dbFeedbackStatisticPassword;
    config.env.DB_FEEDBACKSTATISTIC_DB = config.dbName;
    config.env.DB_FEEDBACKSTATISTIC_ACCEPT_UNAUTHORIZED = 'true';

    env.update(config.env);

    return config;
  },
};

module.exports = setupQpia;
