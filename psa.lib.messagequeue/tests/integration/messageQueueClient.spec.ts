/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';

import * as amqp from 'amqplib';
import * as util from 'util';

import { MessageQueueClient } from '../../src/messageQueueClient';
import { MessageQueueClientHelper } from '../../src/messageQueueClientHelper';
import { MessageQueueTopic, ProbandCreatedMessage } from '../../src';

const delay = util.promisify(setTimeout);

const host = process.env['MESSAGEQUEUE_HOST'] ?? 'localhost';
const port = process.env['MESSAGEQUEUE_PORT']
  ? Number.parseInt(process.env['MESSAGEQUEUE_PORT'])
  : undefined;

const username = process.env['MESSAGEQUEUE_APP_USER'] ?? 'app';
const password = process.env['MESSAGEQUEUE_APP_PASSWORD'] ?? 'app';

const serviceName = 'test-service-a';
const serviceName2 = 'test-service-b';
const topic = MessageQueueTopic.PROBAND_CREATED;

const DELAY_TIME = 10;

const options = {
  host,
  serviceName,
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

const queryMessageCount = async (queueName?: string): Promise<number> => {
  const connection = await amqp.connect(connectionInfo);
  try {
    const channel = await connection.createChannel();
    channel.on('error', () => {
      // nothing to do, we just don't want a crash
    });
    const result = await channel.checkQueue(
      queueName ?? MessageQueueClientHelper.getQueueName(topic, serviceName)
    );
    return result.messageCount;
  } catch {
    return 0;
  } finally {
    await connection.close();
  }
};

const waitForMessageQueueClient = async (): Promise<void> => {
  await MessageQueueClientHelper.waitForAvailability(options);
};

describe('MessageQueueClient Basics', () => {
  before(waitForMessageQueueClient);

  it('should connect and disconnect', async () => {
    const mq = new MessageQueueClient(options);

    await mq.connect();
    await mq.disconnect();
  });

  it('should connect and disconnect without waiting for availability', async () => {
    const mq = new MessageQueueClient(options);

    await mq.connect(false);
    await mq.disconnect();
  });

  it('fail without waiting for availability for unreachable', async () => {
    const mq = new MessageQueueClient({
      host: 'localhost',
      port: 1,
      serviceName: 'asd',
      username,
      password,
    });

    await mq.connect(false).then(
      async () => Promise.reject('expected to reject'),
      (err) => expect(err).instanceof(Error)
    );
  });

  it('isConnected should work', async () => {
    const mq = new MessageQueueClient(options);

    expect(mq.isConnected()).to.be.false;
    await mq.connect();
    expect(mq.isConnected()).to.be.true;
    await mq.disconnect();
    expect(mq.isConnected()).to.be.false;
  });

  it('should throw an error when connecting twice', async () => {
    const mq = new MessageQueueClient(options);

    await mq.connect();

    try {
      await mq.connect().then(
        async () => Promise.reject('expected to reject'),
        (err) => expect(err).instanceof(Error)
      );
    } finally {
      await mq.disconnect();
    }
  });

  it('should throw an error when disconnecting without connection', async () => {
    const mq = new MessageQueueClient(options);

    await mq.disconnect().then(
      async () => Promise.reject('expected to reject'),
      (err) => expect(err).instanceof(Error)
    );
  });

  it('should throw an error when creating consumer without connection', async () => {
    const mq = new MessageQueueClient(options);

    await mq
      .createConsumer(topic, async () => {
        return Promise.resolve();
      })
      .then(
        async () => Promise.reject('expected to reject'),
        (err) => expect(err).instanceof(Error)
      );
  });

  it('should throw an error when creating producer without connection', async () => {
    const mq = new MessageQueueClient(options);

    await mq.createProducer(topic).then(
      async () => Promise.reject('expected to reject'),
      (err) => expect(err).instanceof(Error)
    );
  });

  it('should throw an error when deleting queue without connection', async () => {
    const mq = new MessageQueueClient(options);

    await mq.removeQueues([topic]).then(
      async () => Promise.reject('expected to reject'),
      (err) => expect(err).instanceof(Error)
    );
  });
});

describe('MessageQueueClient functionality', () => {
  before(waitForMessageQueueClient);

  beforeEach(async () => {
    // we have to delete old queues so we can be sure that they don't contain old messages
    const connection = await amqp.connect(connectionInfo);
    const channel = await connection.createChannel();
    await channel.deleteQueue(
      MessageQueueClientHelper.getQueueName(topic, serviceName)
    );
    await channel.deleteQueue(
      MessageQueueClientHelper.getQueueName(topic, serviceName2)
    );
    await channel.deleteQueue(
      MessageQueueClientHelper.getDeadLetterQueueName(topic, serviceName)
    );

    await connection.close();
  });

  it('publish and consume should work', async () => {
    const mq1 = new MessageQueueClient(options);
    const mq2 = new MessageQueueClient(options);

    await mq1.connect();
    await mq2.connect();

    try {
      interface Arguments {
        message: ProbandCreatedMessage;
        timestamp: Date;
      }

      const expectedMessage: ProbandCreatedMessage = {
        pseudonym: 'test',
        studyName: 'test',
      };
      const producer = await mq1.createProducer(topic);

      let resolver: (value: Arguments | PromiseLike<Arguments>) => void;

      const consumer = new Promise<Arguments>(
        (resolve) => (resolver = resolve)
      );

      await mq2.createConsumer(topic, async (message, timestamp: Date) => {
        resolver({ message, timestamp });
        return Promise.resolve();
      });

      producer.publish(expectedMessage).catch(console.error);

      const message = await consumer;

      expect(message.message).to.deep.equal(expectedMessage);
      expect(message.timestamp).to.be.instanceOf(Date);
    } finally {
      await mq1.disconnect();
      await mq2.disconnect();
    }
  });

  it('retry should work when an error occures', async () => {
    const EXPECTED_NUMBER_OF_MESSAGES = 2;

    const mq1 = new MessageQueueClient(options);
    const mq2 = new MessageQueueClient(options);

    await mq1.connect();
    await mq2.connect();

    try {
      let received = 0;
      const producer = await mq1.createProducer(topic);
      await mq2.createConsumer(topic, async () => {
        received++;
        if (received === 1) {
          throw new Error('test error');
        }
        return Promise.resolve();
      });

      await producer.publish({
        pseudonym: 'test',
        studyName: 'test',
      });

      while (received !== EXPECTED_NUMBER_OF_MESSAGES) {
        await delay(DELAY_TIME);
      }
    } finally {
      await mq1.disconnect();
      await mq2.disconnect();
    }
  });

  it('should manage queues for different services', async () => {
    const mq1 = new MessageQueueClient(options);

    const mqA1 = new MessageQueueClient(options);
    const mqA2 = new MessageQueueClient(options);
    const mqB1 = new MessageQueueClient(options2);
    const mqB2 = new MessageQueueClient(options2);

    await mq1.connect();
    await mqA1.connect();
    await mqA2.connect();
    await mqB1.connect();
    await mqB2.connect();

    try {
      let receivedA = 0;
      let receivedB = 0;
      const producer = await mq1.createProducer(topic);
      await mqA1.createConsumer(topic, async () => {
        receivedA++;
        return Promise.resolve();
      });
      await mqA2.createConsumer(topic, async () => {
        receivedA++;
        return Promise.resolve();
      });
      await mqB1.createConsumer(topic, async () => {
        receivedB++;
        return Promise.resolve();
      });
      await mqB2.createConsumer(topic, async () => {
        receivedB++;
        return Promise.resolve();
      });

      const count = 10;
      for (let i = 0; i < count; i++) {
        await producer.publish({
          pseudonym: 'test',
          studyName: 'test',
        });
      }

      while (receivedA !== count || receivedB !== count) {
        await delay(DELAY_TIME);
      }
    } finally {
      await mq1.disconnect();
      await mqA1.disconnect();
      await mqA2.disconnect();
      await mqB1.disconnect();
      await mqB2.disconnect();
    }
  });

  it('should stop to requeue a message after some tries', async () => {
    const EXPECTED_NUMBER_OF_MESSAGES = 2;

    const mq1 = new MessageQueueClient(options);
    const mq2 = new MessageQueueClient(options);

    await mq1.connect();
    await mq2.connect();

    try {
      let received = 0;
      const producer = await mq1.createProducer(topic);
      await mq2.createConsumer(topic, async () => {
        received++;
        return Promise.reject(new Error('test error'));
      });

      await producer.publish({
        pseudonym: 'test',
        studyName: 'test',
      });

      while (received !== EXPECTED_NUMBER_OF_MESSAGES) {
        await delay(DELAY_TIME);
      }
    } finally {
      await mq1.disconnect();
      await mq2.disconnect();
    }
  });

  it('should be able to remove a non existing queue', async () => {
    const mq1 = new MessageQueueClient(options);

    await mq1.connect();

    try {
      await mq1.removeQueue('some-non-existing-queue' as MessageQueueTopic);
    } finally {
      await mq1.disconnect();
    }
  });

  it('should be able to remove a existing nonempty queue', async () => {
    const EXPECTED_NUMBER_OF_MESSAGES = 1;

    const mq1 = new MessageQueueClient(options);
    const mq2 = new MessageQueueClient(options);
    const mq3 = new MessageQueueClient(options);

    let received = 0;
    await mq1.connect();
    try {
      await mq1.createConsumer(topic, async () => {
        received++;
        return Promise.resolve();
      });
    } finally {
      await mq1.disconnect();
    }

    await mq2.connect();
    try {
      const producer = await mq2.createProducer(topic);
      await producer.publish({
        pseudonym: 'test',
        studyName: 'test',
      });

      while ((await queryMessageCount()) !== EXPECTED_NUMBER_OF_MESSAGES) {
        await delay(DELAY_TIME);
      }
    } finally {
      await mq2.disconnect();
    }

    await mq3.connect();
    try {
      await mq3.removeQueues([topic]);
    } finally {
      await mq3.disconnect();
    }

    expect(received).to.equal(0);
  });

  it('should be able to remove a existing nonempty queue twice', async () => {
    const mq1 = new MessageQueueClient(options);
    const mq2 = new MessageQueueClient(options);
    const mq3 = new MessageQueueClient(options);
    const mq4 = new MessageQueueClient(options);

    let received = 0;
    await mq1.connect();
    try {
      await mq1.createConsumer(topic, async () => {
        received++;
        return Promise.resolve();
      });
    } finally {
      await mq1.disconnect();
    }

    await mq2.connect();
    try {
      const producer = await mq2.createProducer(topic);
      await producer.publish({
        pseudonym: 'test',
        studyName: 'test',
      });

      while ((await queryMessageCount()) !== 1) {
        await delay(DELAY_TIME);
      }
    } finally {
      await mq2.disconnect();
    }

    await mq3.connect();
    try {
      await mq3.removeQueues([topic]);
    } finally {
      await mq3.disconnect();
    }

    await mq4.connect();
    try {
      await mq4.removeQueues([topic]);
    } finally {
      await mq4.disconnect();
    }

    expect(received).to.equal(0);
  });

  it('should be able to remove a existing empty queue', async () => {
    const mq1 = new MessageQueueClient(options);
    const mq2 = new MessageQueueClient(options);

    let received = 0;
    await mq1.connect();
    try {
      await mq1.createConsumer(topic, async () => {
        received++;
        return Promise.resolve();
      });
    } finally {
      await mq1.disconnect();
    }

    await mq2.connect();
    try {
      await mq2.removeQueues([topic]);
    } finally {
      await mq2.disconnect();
    }
    expect(received).to.equal(0);
  });

  it('should store messages', async () => {
    const mq1 = new MessageQueueClient(options);
    const mq2 = new MessageQueueClient(options);
    const mq3 = new MessageQueueClient(options);

    let receivedA = 0;
    await mq1.connect();
    try {
      await mq1.createConsumer(topic, async () => {
        receivedA++;
        return Promise.resolve();
      });
    } finally {
      await mq1.disconnect();
    }

    await mq2.connect();
    try {
      const producer = await mq2.createProducer(topic);
      await producer.publish({
        pseudonym: 'test',
        studyName: 'test',
      });

      while ((await queryMessageCount()) !== 1) {
        await delay(DELAY_TIME);
      }
    } finally {
      await mq2.disconnect();
    }

    await mq3.connect();
    try {
      let receivedB = 0;

      await mq3.createConsumer(topic, async () => {
        receivedB++;
        return Promise.resolve();
      });

      while (receivedB !== 1) {
        await delay(DELAY_TIME);
      }
    } finally {
      await mq3.disconnect();
    }

    expect(receivedA).to.equal(0);
  });

  it('should put failed messages to a dead letter queue', async () => {
    const mq1 = new MessageQueueClient(options);
    const mq2 = new MessageQueueClient(options);

    const EXPECTED_NUMBER_OF_MESSAGES = 2;

    let received = 0;

    await mq1.connect();
    await mq2.connect();

    try {
      await mq1.createConsumer(topic, async (): Promise<void> => {
        received++;
        return Promise.reject(new Error('test error'));
      });

      const producer = await mq2.createProducer(topic);
      await producer.publish({
        pseudonym: 'test',
        studyName: 'test',
      });

      while (
        (await queryMessageCount(
          MessageQueueClientHelper.getDeadLetterQueueName(topic, serviceName)
        )) !== 1
      ) {
        console.log({
          count: await queryMessageCount(
            MessageQueueClientHelper.getDeadLetterQueueName(topic, serviceName)
          ),
        });
        await delay(DELAY_TIME);
      }
    } finally {
      await mq1.disconnect();
      await mq2.disconnect();
    }

    expect(received).to.equal(EXPECTED_NUMBER_OF_MESSAGES);
  });
});
