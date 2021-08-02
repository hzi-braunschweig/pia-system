/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const util = require('util');
const net = require('net');
const docker = require('./docker');

const sleep = util.promisify(setTimeout);

const setupMessagequeue = {
  setup: async function ({
    messagequeueImage,
    messagequeuePath,
    messagequeueContainer,
    messagequeuePort,

    env,
  }) {
    console.log('building ' + messagequeueContainer);
    await docker.build(
      messagequeueImage,
      messagequeuePath,
      {},
      messagequeuePath + '/Dockerfile'
    );
    console.log(
      `setting up the messagequeue to listen on port ${messagequeuePort}`
    );
    await docker.rmf(messagequeueContainer);

    const ports = {};
    ports[messagequeuePort] = 5672;

    await docker.run(messagequeueContainer, messagequeueImage, env, ports);
    await this.waitForPort(messagequeuePort);
    // await this.waitForMessagequeue(messagequeueContainer);
    // await sleep(10000);

    console.log(messagequeueContainer + ' is ready');
  },
  checkPort: async function (port) {
    const client = new net.Socket();
    await new Promise((resolve) => {
      client.once('error', () => {
        resolve(false);
      });
      client.connect(port, 'localhost', () => {
        resolve(true);
      });
    });
    client.destroy();
  },
  waitForPort: async function (port) {
    while (!this.checkPort(port)) {
      await sleep(100);
    }
  },
  waitForMessagequeue: async function (containerName) {
    while (true) {
      try {
        const healthCheck = 'rabbitmqctl wait';
        await docker.exec(
          containerName,
          `sh -c "${healthCheck.replace(/\$/g, '\\$')}"`
        );
        break;
      } catch (err) {
        console.log(err);
        await sleep(100);
      }
    }
  },
};

module.exports = setupMessagequeue;
