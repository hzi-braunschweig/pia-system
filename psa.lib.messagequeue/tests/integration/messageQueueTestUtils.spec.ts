/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';

import { createSandbox } from 'sinon';

import * as amqp from 'amqplib';
import * as util from 'util';

import { MessageQueueClient } from '../../src/messageQueueClient';
import { MessageQueueClientHelper } from '../../src/messageQueueClientHelper';
import { MessageQueueTestUtils } from '../../src/messageQueueTestUtils';
import { MessageQueueTopic } from '../../src';

const delay = util.promisify(setTimeout);

const host = process.env['MESSAGEQUEUE_HOST'] ?? 'localhost';
const port = process.env['MESSAGEQUEUE_PORT']
  ? Number.parseInt(process.env['MESSAGEQUEUE_PORT'])
  : undefined;

const username = process.env['MESSAGEQUEUE_APP_USER'] ?? 'app';
const password = process.env['MESSAGEQUEUE_APP_PASSWORD'] ?? 'app';

const serviceName1 = 'test-service-a';
const serviceName2 = 'test-service-b';
const topic1 = MessageQueueTopic.PROBAND_CREATED;
const topic2 = MessageQueueTopic.PROBAND_DELETED;

const DELAY_TIME = 10;

const options1 = {
  host,
  serviceName: serviceName1,
  port,
  username,
  password,
};

const options2 = {
  host,
  serviceName: serviceName2,
  port,
  username,
  password,
};

const connectionInfo = {
  hostname: host,
  port,
  username,
  password,
};

const waitForMessageQueueClient = async (): Promise<void> => {
  await MessageQueueClientHelper.waitForAvailability(options1);
};

describe('MessageQueueTestUtils', () => {
  before(waitForMessageQueueClient);

  const mq1 = new MessageQueueClient(options1);
  const mq2 = new MessageQueueClient(options2);

  beforeEach(async () => {
    // we have to delete old queues so we can be sure that they don't contain old messages
    const connection = await amqp.connect(connectionInfo);
    const channel = await connection.createChannel();

    for (const serviceName of [serviceName1, serviceName2]) {
      for (const topic of [topic1, topic2]) {
        await channel.deleteQueue(
          MessageQueueClientHelper.getQueueName(topic, serviceName)
        );
        await channel.deleteQueue(
          MessageQueueClientHelper.getQueueName(topic, serviceName)
        );
      }
    }

    await connection.close();

    await mq1.connect();
    await mq2.connect();
  });

  afterEach(async () => {
    await mq1.disconnect();
    await mq2.disconnect();
  });

  describe('injectMessageProcessedAwaiter', () => {
    it('should work', async () => {
      let received = 0;

      const producer = await mq1.createProducer(topic1);
      const messageProcessed =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(mq2, topic1);

      await mq2.createConsumer(topic1, async () => {
        await delay(DELAY_TIME);
        received++;
        return Promise.resolve();
      });

      await producer.publish({ x: 'dummy' });

      await messageProcessed;
      expect(received).to.equal(1);
    });

    it('should filter by the topic', async () => {
      let processed2 = 0;

      const producer1 = await mq1.createProducer(topic1);
      const topic1Processed =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(mq2, topic1);
      const topic2Processed =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(mq2, topic2);

      void topic2Processed.then(() => {
        processed2++;
      });

      await mq2.createConsumer(topic1, async () => {
        return Promise.resolve();
      });
      await mq2.createConsumer(topic2, async () => {
        return Promise.resolve();
      });

      await producer1.publish({ x: 'dummy' });

      await topic1Processed;

      expect(processed2).to.equal(0);
    });

    it('should only be called for the correct client', async () => {
      let processed1 = 0;

      const producer1 = await mq1.createProducer(topic1);
      const client1messageProcessed =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(mq1, topic1);
      const client2messageProcessed =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(mq2, topic1);

      void client1messageProcessed.then(() => {
        processed1++;
      });

      await mq2.createConsumer(topic1, async () => {
        return Promise.resolve();
      });

      await producer1.publish({ x: 'dummy' });

      await client2messageProcessed;

      expect(processed1).to.equal(0);
    });

    it('should work for multiple clients', async () => {
      const producer1 = await mq1.createProducer(topic1);
      const client1messageProcessed =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(mq1, topic1);
      const client2messageProcessed =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(mq2, topic1);

      await mq1.createConsumer(topic1, async () => {
        return Promise.resolve();
      });
      await mq2.createConsumer(topic1, async () => {
        return Promise.resolve();
      });

      await producer1.publish({ x: 'dummy' });

      await client1messageProcessed;
      await client2messageProcessed;
    });

    it('should work with sinon', async () => {
      const sandbox = createSandbox();

      const producer1 = await mq1.createProducer(topic1);
      const client1messageProcessed =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          mq1,
          topic1,
          sandbox
        );
      const client2messageProcessed =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          mq2,
          topic1,
          sandbox
        );

      await mq1.createConsumer(topic1, async () => {
        return Promise.resolve();
      });
      await mq2.createConsumer(topic1, async () => {
        return Promise.resolve();
      });

      await producer1.publish({ x: 'dummy' });

      await client1messageProcessed;
      await client2messageProcessed;
    });

    it('should not be called after cleanup with sinon', async () => {
      let processed1 = 0;
      const sandbox = createSandbox();

      const producer1 = await mq1.createProducer(topic1);
      const client1messageProcessed =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          mq1,
          topic1,
          sandbox
        );
      const client2messageProcessed =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(mq2, topic1);

      void client1messageProcessed.then(() => {
        processed1++;
      });

      await mq1.createConsumer(topic1, async () => {
        return Promise.resolve();
      });
      await mq2.createConsumer(topic1, async () => {
        await delay(DELAY_TIME);
        return Promise.resolve();
      });

      sandbox.restore();

      await producer1.publish({ x: 'dummy' });

      await client2messageProcessed;

      expect(processed1).to.equal(0);
    });

    it('should not modify the message', async () => {
      let message: unknown;

      const producer1 = await mq1.createProducer(topic1);
      const client1messageProcessed =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(mq1, topic1);

      await mq1.createConsumer(topic1, async (msg) => {
        message = msg;
        return Promise.resolve();
      });

      await producer1.publish({ x: 'dummy' });

      await client1messageProcessed;

      expect(message).to.deep.equal({ x: 'dummy' });
    });
  });
});
