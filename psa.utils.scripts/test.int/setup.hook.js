/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const env = require('../test.common/env');
const docker = require('../test.common/docker');
const database = require('../test.common/setup-db');
const qpia = require('./setup-qpia');
const ipia = require('./setup-ipia');
const ewpia = require('./setup-ewpia');
const configMessagequeue = require('./config-messagequeue');
const setupMessagequeue = require('../test.common/setup-messagequeue');

// update the env by using the DOTENV_CONFIG_PATH
env.update(env.read(process.env.DOTENV_CONFIG_PATH));

const options = {
  start: {
    qpia: process.env.START_QPIA !== 'false',
    ipia: process.env.START_IPIA === 'true',
    ewpia: process.env.START_EWPIA === 'true',
    messagequeue: process.env.START_MESSAGEQUEUE === 'true',
  },
  keep: {
    qpia: process.env.KEEP_QPIA === 'true',
    ipia: process.env.KEEP_IPIA === 'true',
    ewpia: process.env.KEEP_EWPIA === 'true',
    messagequeue: process.env.KEEP_MESSAGEQUEUE === 'true',
  },
  registry: process.env.DOCKER_REGISTRY || 'registry.gitlab.com',
};

let qpiaConfig = qpia.configure(options);
let ipiaConfig = ipia.configure(options);
let ewpiaConfig = ewpia.configure(options);
let messagequeueConfig = configMessagequeue.configure(options);

// We do not want to setup the ci environment
if (!process.env.CI) {
  exports.mochaHooks = {
    async beforeAll() {
      this.timeout(60000);
      const promises = [];
      if (options.start.qpia) {
        promises.push(await database.setup(qpiaConfig));
      }
      if (options.start.ipia) {
        promises.push(await database.setup(ipiaConfig));
      }
      if (options.start.ewpia) {
        promises.push(await database.setup(ewpiaConfig));
      }
      if (options.start.messagequeue) {
        promises.push(await setupMessagequeue.setup(messagequeueConfig));
      }
      await Promise.all(promises);
    },
    async afterAll() {
      this.timeout(60000);
      if (options.start.qpia && !options.keep.qpia) {
        await docker.rmf(qpiaConfig.postgresContainer);
      }
      if (options.start.ipia && !options.keep.ipia) {
        await docker.rmf(ipiaConfig.postgresContainer);
      }
      if (options.start.ewpia && !options.keep.ewpia) {
        await docker.rmf(ewpiaConfig.postgresContainer);
      }
      if (options.start.messagequeue && !options.keep.messagequeue) {
        await docker.rmf(messagequeueConfig.messagequeueContainer);
      }
    },
  };
}
