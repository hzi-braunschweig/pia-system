/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';

import { MessageQueueClientHelper } from './messageQueueClientHelper';

export class MessageQueueClientConnection {
  protected connection: amqp.Connection | null = null;

  public constructor(
    private readonly options: {
      host: string;
      port?: number;
      username: string;
      password: string;
    }
  ) {}

  public isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Connects to the message queue host.
   */
  public async connect(waitForAvailability = true): Promise<void> {
    if (this.connection) {
      throw new Error('already connected');
    }

    if (waitForAvailability) {
      await MessageQueueClientHelper.waitForAvailability(this.options);
    }

    this.connection = await amqp.connect({
      hostname: this.options.host,
      port: this.options.port,
      username: this.options.username,
      password: this.options.password,
    });
    this.connection.once('close', () => {
      console.warn('connection to messagequeue got closed');
      this.connection = null;
    });
    this.connection.once('error', (error) => {
      console.error('error on messagequeue connection');
      console.error(error);
      this.connection = null;
    });
  }

  /**
   * Disconnects from the message queue host
   */
  public async disconnect(): Promise<void> {
    if (!this.connection) {
      throw new Error('not connected');
    }

    this.connection.removeAllListeners();
    await this.connection.close();
    this.connection = null;
  }
}
