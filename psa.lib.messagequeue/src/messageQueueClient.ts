/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';

import { MessageQueueClientConnection } from './messageQueueClientConnection';
import { MessageQueueClientHelper } from './messageQueueClientHelper';
import { HandleMessageArgs } from './messageQueueClientInternals';
import { MessageQueueTopic } from './messageQueueTopics';

export interface Producer<M> {
  publish: (message: M) => Promise<boolean>;
}

interface Packet<M> {
  message: M;
}

interface MessageProperties {
  timestamp: number;
}

// we are using fanout because we want this message to be broadcasted
// to all queues that are interested in that topic
const exchangeType = 'fanout';

const exchangeOptions: amqp.Options.AssertExchange = {
  durable: true,
};

const queueOptions: amqp.Options.AssertQueue = {
  exclusive: false,
  durable: true,
  autoDelete: false,
};

const contentEncoding = 'utf-8';

const publishOptions: amqp.Options.Publish = {
  persistent: true,
  contentType: 'application/json',
  contentEncoding,
};

const HTTP_NOT_FOUND = 404;

export class MessageQueueClient extends MessageQueueClientConnection {
  protected readonly serviceName: string;

  public constructor({
    serviceName,
    host,
    port,
    username,
    password,
  }: {
    serviceName: string;
    host: string;
    port?: number;
    username: string;
    password: string;
  }) {
    super({
      host,
      port,
      username,
      password,
    });

    this.serviceName = serviceName;
  }

  /**
   * Creates a producer that can be used to publish message for
   * a specific topic.
   * This producer should be reused! Don't create a producer
   * for every message you want to send!
   * Otherwise, we will get a memory leak!
   */
  public async createProducer<M>(
    topic: MessageQueueTopic
  ): Promise<Producer<M>> {
    if (!this.connection) {
      throw new Error('not connected');
    }

    const channel = await this.connection.createChannel();
    await channel.assertExchange(topic, exchangeType, exchangeOptions);

    return {
      publish: async (message: M): Promise<boolean> => {
        const content = Buffer.from(
          JSON.stringify({ message }),
          contentEncoding
        );
        return Promise.resolve(
          channel.publish(topic, this.serviceName, content, {
            ...publishOptions,
            timestamp: Date.now(),
          })
        );
      },
    };
  }

  /**
   * Removes (or unlinks) a message queue.
   * This can be used if a service is no longer interested in a specific topic.
   * It should only be called on service initialisation.
   */
  public async removeQueue(topic: MessageQueueTopic): Promise<void> {
    if (!this.connection) {
      throw new Error('not connected');
    }

    const queueName = MessageQueueClientHelper.getQueueName(
      topic,
      this.serviceName
    );
    const channel = await this.connection.createChannel();
    channel.on('error', () => {
      // the 404 has to be catched here too
      // otherwise we have an uncaught exception
    });

    let queue: amqp.Replies.AssertQueue;
    try {
      queue = await channel.checkQueue(queueName);
    } catch (error) {
      // channel gets closed automatically on error
      if (error && (error as { code: number }).code === HTTP_NOT_FOUND) {
        return;
      }
      throw error;
    }

    if (queue.messageCount > 0) {
      console.warn(
        `messages remaining on ${queueName}: ${queue.messageCount} - we will just unlink it`
      );
      await channel.unbindQueue(queueName, topic, '*');
    } else {
      console.log(`deleting queue ${queueName}`);
      await channel.deleteQueue(queueName);
    }

    await channel.close();
  }

  /**
   * Removes (or unlinks) multiple message queues.
   * This can be used if a service is no longer interested in a specific topic.
   * It should only be called on service initialisation.
   */
  public async removeQueues(topics: MessageQueueTopic[]): Promise<void> {
    for (const topic of topics) {
      await this.removeQueue(topic);
    }
  }

  /**
   * Creates a consumer of messages on specific topic.
   * If the message callback throws an exception, the message will get
   * rescheduled once!
   */
  public async createConsumer<M>(
    topic: MessageQueueTopic,
    onMessage: HandleMessageArgs<M>['onMessage']
  ): Promise<void> {
    if (!this.connection) {
      throw new Error('not connected');
    }

    const channel = await this.connection.createChannel();
    await channel.assertExchange(topic, exchangeType, {
      durable: true,
    });

    const queue = await channel.assertQueue(
      MessageQueueClientHelper.getQueueName(topic, this.serviceName),
      queueOptions
    );

    const deadLetterQueue = await channel.assertQueue(
      MessageQueueClientHelper.getDeadLetterQueueName(topic, this.serviceName),
      queueOptions
    );

    await channel.bindQueue(queue.queue, topic, '*');

    await channel.consume(
      queue.queue,
      (message: amqp.ConsumeMessage | null) => {
        if (!message) {
          return;
        }
        void this.handleMessage({
          message,
          onMessage,
          channel,
          topic,
          deadLetterQueue,
        });
      }
    );
  }

  private async handleMessage<M>(
    this: void,
    args: HandleMessageArgs<M>
  ): Promise<void> {
    const redelivered = args.message.fields.redelivered;

    try {
      const properties = args.message.properties as MessageProperties;
      const data = JSON.parse(args.message.content.toString()) as Packet<M>;
      await args.onMessage(data.message, new Date(properties.timestamp));
      // message got successfully handled
      args.channel.ack(args.message, false);
    } catch {
      if (redelivered) {
        console.error(`dropping message on ${args.topic} to dead-letter-queue`);
        args.channel.sendToQueue(
          args.deadLetterQueue.queue,
          args.message.content,
          publishOptions
        );
        args.channel.ack(args.message, false);
      } else {
        // give it another try
        args.channel.nack(args.message, false, !redelivered);
      }
    }
  }
}
