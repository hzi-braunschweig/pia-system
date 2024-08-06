/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueClient, MessageQueueTopic } from '@pia/lib-messagequeue';
import { config } from '../config';
import { SupportedTopics, SupportedMessages, EventType } from '../events';
import { EventService } from './eventService';
import { ConfigurationService } from './configurationService';

export class MessageQueueService extends MessageQueueClient {
  public async connect(): Promise<void> {
    await super.connect();

    console.log(`Creating consumers | Topics: ${SupportedTopics.join(', ')}`);

    const consumers = SupportedTopics.map(async (topic) =>
      this.createConsumer(
        topic,
        async (message: SupportedMessages, timestamp: Date) =>
          this.saveMessageAsEvent(topic, message, timestamp)
      )
    );

    consumers.push(
      this.createConsumer(
        MessageQueueTopic.JOB_EVENTHISTORY_CLEANUP_EVENTS,
        async () => this.cleanupEvents()
      )
    );

    await Promise.all(consumers);
  }

  private async saveMessageAsEvent(
    topic: EventType,
    message: SupportedMessages,
    timestamp: Date
  ): Promise<void> {
    const { studyName, ...payload } = message;
    console.log(
      `Saving event | ${timestamp.toISOString()} | ${topic} | ${studyName}`
    );

    await EventService.saveEvent({
      type: topic,
      timestamp,
      studyName,
      payload,
    });
  }

  private async cleanupEvents(): Promise<void> {
    const historyConfig = await ConfigurationService.getConfig();

    if (!historyConfig?.active || !historyConfig.retentionTimeInDays) {
      return Promise.resolve();
    }

    const result = await EventService.cleanupEvents(
      historyConfig.retentionTimeInDays
    );

    console.log(
      `Removed ${String(result.countRemovedEvents)}/${
        result.countEventsInitial
      } events, older than ${result.referenceDate.toISOString()}`
    );
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
