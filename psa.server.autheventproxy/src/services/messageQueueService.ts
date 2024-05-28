/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';
import {
  MessageQueueClient,
  MessageQueueClientHelper,
} from '@pia/lib-messagequeue';
import { config } from '../config';
import { EventProxy } from '../proxys/eventProxy';
import { proxies } from '../proxies';

export class MessageQueueService extends MessageQueueClient {
  private _proxies: typeof EventProxy[] = [];

  public set proxies(value: typeof EventProxy[]) {
    this._proxies = value;
  }

  public async connect(waitForAvailability?: boolean): Promise<void> {
    await super.connect(waitForAvailability);

    for (const proxy of this._proxies) {
      try {
        const proxyInstance = await proxy.build(this);
        await this.createTopicConsumer(
          config.servers.authserver.messageQueueExchange,
          proxyInstance.pattern,
          proxyInstance.constructor.name,
          proxyInstance.onMessage.bind(proxyInstance)
        );
        console.log(
          `Registered | ${proxyInstance.constructor.name} | ${proxyInstance.pattern}`
        );
      } catch (e) {
        if (e instanceof Error) {
          console.error(
            `Error | ${proxy.name} failed to initialize | ${e.message}`
          );
        } else {
          console.error(
            `Error | ${proxy.name} failed to initialize | Unknown error`
          );
        }
      }
    }
  }

  public async createTopicConsumer(
    topic: string,
    pattern: string,
    proxyName: string,
    onMessage: (
      channel: amqp.Channel
    ) => (message: amqp.ConsumeMessage | null) => void
  ): Promise<void> {
    const queueName = MessageQueueClientHelper.getQueueName(topic, proxyName);
    const channel = await this.createChannel(topic, 'topic');
    await channel.deleteQueue(topic);
    const queue = await channel.assertQueue(queueName, {});

    await this.consume(topic, channel, queue, onMessage(channel), pattern);
  }

  private async createChannel(
    topic: string,
    currentExchangeType: string
  ): Promise<amqp.Channel> {
    if (!this.connection) {
      throw new Error('You have to establish a connection first.');
    }

    const channel = await this.connection.createChannel();
    await channel.assertExchange(topic, currentExchangeType, {
      durable: true,
    });

    return channel;
  }

  private async consume(
    topic: string,
    channel: amqp.Channel,
    queue: amqp.Replies.AssertQueue,
    callback: (message: amqp.ConsumeMessage | null) => void,
    pattern = '*'
  ): Promise<amqp.Replies.Consume> {
    await channel.bindQueue(queue.queue, topic, pattern);
    return await channel.consume(queue.queue, callback);
  }
}

let messageQueueService: MessageQueueService | null = null;

export function MessageQueueServiceFactory(
  messageQueueConfig: typeof config.servers.messageQueue
): MessageQueueService {
  if (!messageQueueService) {
    messageQueueService = new MessageQueueService(messageQueueConfig);
    messageQueueService.proxies = proxies;
  }

  return messageQueueService;
}
