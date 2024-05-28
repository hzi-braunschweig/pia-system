/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  MessageQueueClient,
  MessageQueueTopic,
  ComplianceCreatedMessage,
  ProbandDeletedMessage,
  QuestionnaireInstanceReleasedMessage,
} from '@pia/lib-messagequeue';
import { config } from '../config';
import { SormasStatusUpdateService } from './sormasStatusUpdateService';
import { getRepository } from 'typeorm';
import { FollowUp } from '../entities/followUp';

import { SymptomTransmission } from '../entities/symptomTransmission';
import { QuestionnaireAnswersTransmissionService } from './questionnaireAnswersTransmissionService';

export class MessageQueueService extends MessageQueueClient {
  private static async onProbandDeleted(
    message: ProbandDeletedMessage
  ): Promise<void> {
    await SormasStatusUpdateService.userDelete(message.pseudonym);
    await getRepository(FollowUp).delete({ pseudonym: message.pseudonym });
    await getRepository(SymptomTransmission).delete({
      pseudonym: message.pseudonym,
    });
  }

  private static async onComplianceCreated(
    message: ComplianceCreatedMessage
  ): Promise<void> {
    await SormasStatusUpdateService.complianceCreate(message.pseudonym);
  }

  private static async onQuestionnaireInstanceReleased(
    message: QuestionnaireInstanceReleasedMessage
  ): Promise<void> {
    await QuestionnaireAnswersTransmissionService.onQuestionnaireInstanceReleased(
      message.id,
      message.releaseVersion
    );
  }

  public async connect(): Promise<void> {
    await super.connect();

    await this.createConsumer(
      MessageQueueTopic.COMPLIANCE_CREATED,
      async (message: ComplianceCreatedMessage) => {
        await MessageQueueService.onComplianceCreated(message);
      }
    );

    await this.createConsumer(
      MessageQueueTopic.PROBAND_DELETED,
      async (message: ProbandDeletedMessage) => {
        await MessageQueueService.onProbandDeleted(message);
      }
    );

    await this.createConsumer(
      MessageQueueTopic.QUESTIONNAIRE_INSTANCE_RELEASED,
      async (message: QuestionnaireInstanceReleasedMessage) => {
        await MessageQueueService.onQuestionnaireInstanceReleased(message);
      }
    );
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
