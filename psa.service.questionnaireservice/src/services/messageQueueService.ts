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
  QuestionnaireInstanceAnsweringStartedMessage,
  QuestionnaireInstanceCreatedMessage,
} from '@pia/lib-messagequeue';
import { QuestionnaireInstanceService } from './questionnaireInstanceService';
import { QuestionnaireInstance } from '../entities/questionnaireInstance';
import { QuestionnaireInstanceStatus } from '../models/questionnaireInstance';
import isInstanceWithNarrowedStatus from '../helpers/isInstanceWithNarrowedStatus';

export class MessageQueueService extends MessageQueueClient {
  private questionnaireInstanceCreatedProducer?: Producer<QuestionnaireInstanceCreatedMessage>;
  private questionnaireInstanceReleasedProducer?: Producer<QuestionnaireInstanceReleasedMessage>;
  private questionnaireInstanceAnsweringStartedProducer?: Producer<QuestionnaireInstanceAnsweringStartedMessage>;

  public static async onUserDeactivated(
    message: ProbandDeactivatedMessage
  ): Promise<void> {
    await QuestionnaireInstanceService.deleteInactiveForProbandQuestionnaireInstances(
      message.pseudonym
    );
    await QuestionnaireInstanceService.expireQuestionnaireInstances(
      message.pseudonym,
      ['active', 'in_progress'],
      'for_probands'
    );
  }

  public async connect(): Promise<void> {
    await super.connect();

    await this.createConsumer(
      MessageQueueTopic.PROBAND_DEACTIVATED,
      async (message) => {
        await MessageQueueService.onUserDeactivated(message);
      }
    );

    this.questionnaireInstanceCreatedProducer = await this.createProducer(
      MessageQueueTopic.QUESTIONNAIRE_INSTANCE_CREATED
    );

    this.questionnaireInstanceReleasedProducer = await this.createProducer(
      MessageQueueTopic.QUESTIONNAIRE_INSTANCE_RELEASED
    );

    this.questionnaireInstanceAnsweringStartedProducer =
      await this.createProducer(
        MessageQueueTopic.QUESTIONNAIRE_INSTANCE_ANSWERING_STARTED
      );
  }

  public async sendQuestionnaireInstanceCreated(
    questionnaireInstance: QuestionnaireInstance
  ): Promise<void> {
    if (!this.questionnaireInstanceCreatedProducer) {
      throw new Error('connect() must be called before sending messages');
    }

    type AllowedStatus = Extract<
      QuestionnaireInstanceStatus,
      'inactive' | 'active' | 'expired'
    >;

    if (
      !isInstanceWithNarrowedStatus<AllowedStatus>(questionnaireInstance, [
        'inactive',
        'active',
        'expired',
      ])
    ) {
      throw new Error(
        `Instance with id "${questionnaireInstance.id}" has wrong status for sending created message: ${questionnaireInstance.status}`
      );
    }

    await this.questionnaireInstanceCreatedProducer.publish({
      id: questionnaireInstance.id,
      studyName: questionnaireInstance.studyId,
      pseudonym: questionnaireInstance.pseudonym,
      status: questionnaireInstance.status,
      questionnaire: {
        id: questionnaireInstance.questionnaire?.id ?? 0,
        customName: questionnaireInstance.questionnaire?.customName ?? '',
      },
    });
  }

  public async sendQuestionnaireInstanceReleased(
    questionnaireInstance: Pick<
      QuestionnaireInstance,
      | 'id'
      | 'status'
      | 'releaseVersion'
      | 'studyId'
      | 'pseudonym'
      | 'questionnaire'
    > & { status: 'released' | 'released_once' | 'released_twice' }
  ): Promise<void> {
    if (!this.questionnaireInstanceReleasedProducer) {
      throw new Error('not connected to messagequeue');
    }

    await this.questionnaireInstanceReleasedProducer.publish({
      id: questionnaireInstance.id,
      releaseVersion: questionnaireInstance.releaseVersion ?? 0,
      studyName: questionnaireInstance.studyId,
      pseudonym: questionnaireInstance.pseudonym,
      status: questionnaireInstance.status,
      questionnaire: {
        id: questionnaireInstance.questionnaire?.id ?? 0,
        customName: questionnaireInstance.questionnaire?.customName ?? '',
      },
    });
  }

  public async sendQuestionnaireInstanceAnsweringStarted(
    questionnaireInstance: Pick<
      QuestionnaireInstance,
      'id' | 'status' | 'studyId' | 'pseudonym' | 'questionnaire'
    > & { status: 'in_progress' }
  ): Promise<void> {
    if (!this.questionnaireInstanceAnsweringStartedProducer) {
      throw new Error('not connected to messagequeue');
    }

    await this.questionnaireInstanceAnsweringStartedProducer.publish({
      id: questionnaireInstance.id,
      studyName: questionnaireInstance.studyId,
      pseudonym: questionnaireInstance.pseudonym,
      status: questionnaireInstance.status,
      questionnaire: {
        id: questionnaireInstance.questionnaire?.id ?? 0,
        customName: questionnaireInstance.questionnaire?.customName ?? '',
      },
    });
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
