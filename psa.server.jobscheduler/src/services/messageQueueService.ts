/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  MessageQueueClient,
  MessageQueueTopic,
  Producer,
} from '@pia/lib-messagequeue';
import { config } from '../config';
import { CronTableMap } from '../cronTable';

export class MessageQueueService extends MessageQueueClient {
  public producers: Map<MessageQueueTopic, Producer<void>> = new Map();

  public async connect(): Promise<void> {
    await super.connect();
  }

  public async setupProducers(cronTable: CronTableMap): Promise<void> {
    for (const topic of cronTable.keys()) {
      this.producers.set(topic, await this.createProducer(topic));
    }
  }

  public async publishMessageForTopic(topic: MessageQueueTopic): Promise<void> {
    if (!this.producers.has(topic)) {
      throw new Error(`No producer found for topic ${topic}`);
    }

    console.log('Published to', topic);

    await this.producers.get(topic)?.publish();
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
