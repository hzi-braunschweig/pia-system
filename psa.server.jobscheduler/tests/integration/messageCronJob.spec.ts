/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */
import { MessageQueueTopic, MessageQueueClient } from '@pia/lib-messagequeue';
import MessageCronJob from '../../src/models/messageCronJob';
import sinon from 'sinon';
import { expect } from 'chai';
import { config } from '../../src/config';
import { messageQueueService } from '../../src/services/messageQueueService';
import { CronTableMap } from '../../src/cronTable';

describe('MessageCronJob', () => {
  const mqc = new MessageQueueClient(config.servers.messageQueue);
  const fakeTopic = 'fake.topic' as unknown as MessageQueueTopic;
  const cronTimeOneEveryMinute = '* * * * *';
  const cronTableFixture: CronTableMap = new Map([
    [fakeTopic, cronTimeOneEveryMinute],
  ]);

  let countMessages = 0;
  let clock: sinon.SinonFakeTimers;

  before(async () => {
    clock = sinon.useFakeTimers({
      now: new Date('2024-07-25T00:00:00Z'),
      shouldAdvanceTime: true,
    });
    await messageQueueService.connect();
    await messageQueueService.setupProducers(cronTableFixture);
    await mqc.connect(true);
  });

  after(async () => {
    await mqc.disconnect();
    await messageQueueService.disconnect();
    clock.restore();
  });

  beforeEach(async () => {
    // Listen to the message queue
    await mqc.createConsumer(fakeTopic, async () => {
      countMessages++;
      return Promise.resolve();
    });
  });

  it('should publish a message for a topic', (done) => {
    // Prepare
    const messageCronJob = new MessageCronJob(
      fakeTopic,
      cronTimeOneEveryMinute
    );
    const timeout = 1000 * 60 + 150; // 2 minute + 150ms

    // Act
    messageCronJob.start();

    // Assert
    // this timeout simulates time passing for the cronjob
    setTimeout(() => {
      waitForConditionToBeTrue(() => countMessages > 0)
        .then(() => expect(countMessages).to.equal(1))
        .finally(done);
    }, timeout);

    clock.tick(timeout);
  });
});

async function waitForConditionToBeTrue(
  conditionFn: () => boolean,
  tries = 3,
  timeout = 25
): Promise<void> {
  return new Promise<void>((resolve) => {
    let count = 0;
    const handler = (): unknown =>
      conditionFn() || count > tries ? resolve() : count++;

    setInterval(handler, timeout);
  });
}
