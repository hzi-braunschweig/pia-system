/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const random = require('../test.common/random');
const env = require('../test.common/env');

const setupMessagequeue = {
  configure: function ({ registry }) {
    const config = {
      messagequeueContainer: 'pia-messagequeue-test.int',
      messagequeueImage: `${registry}/pia/psa.server.messagequeue:test.int`,
      messagequeuePath: '../psa.server.messagequeue',
      messagequeuePort: 25672,

      messagequeueAdminPassword: random.createRandomString(16),
      messagequeueAppPassword: random.createRandomString(16),
    };

    // In beforeAll it is too late to set the process.env, so we need to do everything sync!
    config.env = env.read(process.env.DOTENV_CONFIG_PATH);

    // Set our messagequeue variables
    config.env.MESSAGEQUEUE_HOST = 'localhost';
    config.env.MESSAGEQUEUE_PORT = config.messagequeuePort;

    config.env.MESSAGEQUEUE_ADMIN_USER = 'admin';
    config.env.MESSAGEQUEUE_ADMIN_PASSWORD = config.messagequeueAdminPassword;
    config.env.MESSAGEQUEUE_APP_USER = 'app';
    config.env.MESSAGEQUEUE_APP_PASSWORD = config.messagequeueAppPassword;

    env.update(config.env);

    return config;
  },
};

module.exports = setupMessagequeue;
