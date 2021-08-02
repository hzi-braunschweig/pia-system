/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const util = require('util');
const net = require('net');
const docker = require('./docker');

const sleep = util.promisify(setTimeout);

const setupSftp = {
  setup: async function ({
    sftpContainer,
    sftpImage,
    sftpPath,
    sftpPort,
    sftpUser,
    sftpPassword,

    env,
  }) {
    console.log('building ' + sftpContainer);
    await docker.build(sftpImage, sftpPath, {}, sftpPath + '/Dockerfile');

    console.log(`setting up the stfp servcer to listen on port ${sftpPort}`);
    await docker.rmf(sftpContainer);

    const ports = {};
    ports[sftpPort] = 22;

    await docker.run(
      sftpContainer,
      sftpImage,
      env,
      ports,
      `${sftpUser}:${sftpPassword}:::upload`
    );
    await this.waitForPort(sftpPort);

    console.log(sftpContainer + ' is ready');
  },
  checkPort: async function (port) {
    const client = new net.Socket();
    const result = await new Promise((resolve) => {
      client.once('error', () => {
        resolve(false);
      });
      client.connect(port, 'localhost', () => {
        resolve(true);
      });
    });
    client.destroy();
    return result;
  },
  waitForPort: async function (port) {
    while (!this.checkPort(port)) {
      await sleep(100);
    }
  },
};

module.exports = setupSftp;
