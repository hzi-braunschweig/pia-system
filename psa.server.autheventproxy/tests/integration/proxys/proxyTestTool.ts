/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';
import { config } from '../../../src/config';
import { KeycloakGenericEvent } from '../../../src/models/keycloakEvent';

export class ProxyTestTool {
  public static readonly keycloakExchange =
    config.servers.authserver.messageQueueExchange;
  protected connection: amqp.Connection | null = null;

  public static encodeContent(
    content: Partial<KeycloakGenericEvent> | Record<string, string>
  ): Buffer {
    return Buffer.from(JSON.stringify(content), 'utf-8');
  }

  public async connect(): Promise<void> {
    this.connection = await amqp.connect({
      hostname: config.servers.messageQueue.host,
      port: config.servers.messageQueue.port,
      username: config.servers.messageQueue.username,
      password: config.servers.messageQueue.password,
    });
  }

  public async close(): Promise<void> {
    await this.connection?.close();
  }

  public async createChannel(
    exchange: string,
    type: string
  ): Promise<amqp.Channel> {
    if (!this.connection) {
      throw Error('not connected');
    }

    const channel = await this.connection.createChannel();
    await channel.assertExchange(exchange, type);

    return channel;
  }

  public async createKeycloakChannel(): Promise<amqp.Channel> {
    return this.createChannel(ProxyTestTool.keycloakExchange, 'topic');
  }

  public async createChannelWithQueue(
    exchange: string,
    queueAt: string
  ): Promise<{
    channel: amqp.Channel;
    queue: amqp.Replies.AssertQueue;
  }> {
    const channel = await this.createChannel(exchange, 'fanout');

    const queue = await channel.assertQueue(`${exchange}@${queueAt}`);
    await channel.bindQueue(queue.queue, exchange, '*');

    return { channel, queue };
  }
}
