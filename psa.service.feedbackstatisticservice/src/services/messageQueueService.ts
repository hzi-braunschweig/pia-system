/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  MessageQueueClient,
  MessageQueueTopic,
  Producer,
  FeedbackStatisticConfigurationUpdatedMessage,
  StudyDeletedMessage,
} from '@pia/lib-messagequeue';
import { config } from '../config';
import { FeedbackStatisticUpdater } from './feedbackStatisticUpdater';
import { FeedbackStatisticConfigurationService } from './feedbackStatisticConfigurationService';

export class MessageQueueService extends MessageQueueClient {
  private configurationUpdated?: Producer<FeedbackStatisticConfigurationUpdatedMessage>;

  private dataOutdated?: Producer<void>;

  public static async onConfigurationUpdated(
    configurationId: number
  ): Promise<void> {
    await FeedbackStatisticUpdater.updateFeedbackStatistic(configurationId);
  }

  public static async onDataOutdated(): Promise<void> {
    await FeedbackStatisticUpdater.updateFeedbackStatistics();
  }

  public static async onStudyDeleted(
    message: StudyDeletedMessage
  ): Promise<void> {
    await FeedbackStatisticConfigurationService.deleteFeedbackStatisticConfigurations(
      message.studyName
    );
  }

  public async connect(): Promise<void> {
    await super.connect();

    this.configurationUpdated = await this.createProducer(
      MessageQueueTopic.FEEDBACKSTATISTIC_CONFIGURATION_UPDATED
    );
    this.dataOutdated = await this.createProducer(
      MessageQueueTopic.FEEDBACKSTATISTIC_OUTDATED
    );

    await this.createConsumer(
      MessageQueueTopic.FEEDBACKSTATISTIC_CONFIGURATION_UPDATED,
      async (message) =>
        await MessageQueueService.onConfigurationUpdated(
          message.configurationId
        )
    );

    await this.createConsumer(
      MessageQueueTopic.FEEDBACKSTATISTIC_OUTDATED,
      async () => await MessageQueueService.onDataOutdated()
    );

    await this.createConsumer(
      MessageQueueTopic.STUDY_DELETED,
      async (message) => await MessageQueueService.onStudyDeleted(message)
    );
  }

  public async sendConfigurationUpdated(
    configurationId: number
  ): Promise<void> {
    if (!this.configurationUpdated) {
      throw new Error('not connected to messagequeue');
    }
    await this.configurationUpdated.publish({
      configurationId,
    });
  }

  public async sendDataOutdated(): Promise<void> {
    if (!this.dataOutdated) {
      throw new Error('not connected to messagequeue');
    }
    await this.dataOutdated.publish();
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
