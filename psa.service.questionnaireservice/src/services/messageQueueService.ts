/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { config } from '../config';
import {
  MessageQueueClient,
  MessageQueueTopic,
  Producer,
  QuestionnaireInstanceReleasedMessage,
  ProbandDeactivatedMessage,
} from '@pia/lib-messagequeue';
import { QuestionnaireInstanceService } from './questionnaireInstanceService';

export class MessageQueueService extends MessageQueueClient {
  private questionnaireinstanceReleasedProducer?: Producer<QuestionnaireInstanceReleasedMessage>;

  public static async onUserDeactivated(
    message: ProbandDeactivatedMessage
  ): Promise<void> {
    await QuestionnaireInstanceService.deleteInactiveForProbandQuestionnaireInstances(
      message.pseudonym
    );
  }

  public async connect(): Promise<void> {
    await super.connect();

    await this.createConsumer(
      MessageQueueTopic.PROBAND_DEACTIVATED,
      async (message: ProbandDeactivatedMessage) => {
        await MessageQueueService.onUserDeactivated(message);
      }
    );

    this.questionnaireinstanceReleasedProducer =
      await this.createProducer<QuestionnaireInstanceReleasedMessage>(
        MessageQueueTopic.QUESTIONNAIRE_INSTANCE_RELEASED
      );
  }

  public async sendQuestionnaireInstanceReleased(
    id: number,
    releaseVersion: number,
    studyName: string
  ): Promise<void> {
    if (!this.questionnaireinstanceReleasedProducer) {
      throw new Error('not connected to messagequeue');
    }
    await this.questionnaireinstanceReleasedProducer.publish({
      id,
      releaseVersion,
      studyName,
    });
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
