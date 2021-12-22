/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import util from 'util';
import { expect } from 'chai';

import { MessageQueueClient } from '@pia/lib-messagequeue';
import { config } from '../../src/config';
import server from '../../src/server';
import { db } from '../../src/db';
import { setup, cleanup } from './messageQueueService.spec.data/setup.helper';

const delay = util.promisify(setTimeout);
const DELAY_TIME = 10;

describe('message queue service', function () {
  const mqc = new MessageQueueClient(config.servers.messageQueue);

  before(async function () {
    await setup();
    await server.init();
    await mqc.connect(true);
  });

  after(async function () {
    await mqc.disconnect();
    await server.stop();
    await cleanup();
  });

  it('should delete personal data on proband.deleted', async () => {
    // Arrange
    const producer = await mqc.createProducer('proband.deleted');

    // Act
    await producer.publish({
      pseudonym: 'QTestProband1',
      deletionType: 'default',
    });

    let personalData = await db.manyOrNone(
      "SELECT * from personal_data WHERE pseudonym='QTestProband1'"
    );
    while (personalData.length) {
      await delay(DELAY_TIME);
      personalData = await db.manyOrNone(
        "SELECT * from personal_data WHERE pseudonym='QTestProband1'"
      );
    }
    const pendingDeletion = await db.manyOrNone(
      "SELECT * FROM pending_deletions WHERE proband_id='QTestProband1'"
    );

    // Assert
    expect(personalData).to.have.length(0);
    expect(pendingDeletion).to.have.length(0);
  });
});
