/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  MessageQueueClient,
  MessageQueueTopic,
  ProbandDeletedMessage,
  ProbandCreatedMessage,
  ProbandLoggedInMessage,
  QuestionnaireInstanceCreatedMessage,
  Producer,
  QuestionnaireInstanceExpiredMessage,
  QuestionnaireInstanceActivatedMessage,
} from '@pia/lib-messagequeue';
import { config } from '../config';
import { NotificationHandlers } from './notificationHandlers';
import { performance } from 'perf_hooks';
import {
  QuestionnaireInstance,
  QuestionnaireInstanceStatus,
} from '../models/questionnaireInstance';
import { Questionnaire } from '../models/questionnaire';
import isInstanceWithNarrowedStatus from '../utilities/isInstanceWithNarrowedStatus';

type QuestionnaireForMessage = Pick<Questionnaire, 'id' | 'custom_name'>;
type QuestionnaireInstanceForMessage = Pick<
  QuestionnaireInstance,
  'id' | 'status' | 'study_id' | 'user_id'
>;

export type QuestionnaireInstanceMessageFn = (
  questionnaireInstance: QuestionnaireInstanceForMessage,
  questionnaire: QuestionnaireForMessage
) => Promise<void>;

export class MessageQueueService extends MessageQueueClient {
  private questionnaireInstanceCreatedProducer?: Producer<QuestionnaireInstanceCreatedMessage>;
  private questionnaireInstanceActivatedProducer?: Producer<QuestionnaireInstanceActivatedMessage>;
  private questionnaireInstanceExpiredProducer?: Producer<QuestionnaireInstanceExpiredMessage>;

  private static async onProbandDeleted(pseudonym: string): Promise<void> {
    const start = performance.now();
    console.log('processing proband.deleted...');
    await NotificationHandlers.handleProbandDeleted(pseudonym);
    console.log(
      'processed proband.deleted (took ' +
        Math.round(performance.now() - start).toString() +
        ' ms)'
    );
  }

  private static async onProbandCreated(pseudonym: string): Promise<void> {
    const start = performance.now();
    console.log('processing proband.created...');
    await NotificationHandlers.handleProbandCreated(pseudonym);
    console.log(
      'processed proband.created (took ' +
        Math.round(performance.now() - start).toString() +
        ' ms)'
    );
  }

  private static async onProbandLoggedIn(pseudonym: string): Promise<void> {
    const start = performance.now();
    console.log('processing proband.logged_in...');
    await NotificationHandlers.handleLoginOfProband(pseudonym);
    console.log(
      'processed proband.logged_in (took ' +
        Math.round(performance.now() - start).toString() +
        ' ms)'
    );
  }

  public async connect(): Promise<void> {
    await super.connect();

    this.questionnaireInstanceCreatedProducer = await this.createProducer(
      MessageQueueTopic.QUESTIONNAIRE_INSTANCE_CREATED
    );

    this.questionnaireInstanceActivatedProducer = await this.createProducer(
      MessageQueueTopic.QUESTIONNAIRE_INSTANCE_ACTIVATED
    );

    this.questionnaireInstanceExpiredProducer = await this.createProducer(
      MessageQueueTopic.QUESTIONNAIRE_INSTANCE_EXPIRED
    );

    await this.createConsumer(
      MessageQueueTopic.PROBAND_DELETED,
      async (message: ProbandDeletedMessage) =>
        await MessageQueueService.onProbandDeleted(message.pseudonym)
    );

    await this.createConsumer(
      MessageQueueTopic.PROBAND_CREATED,
      async (message: ProbandCreatedMessage) =>
        await MessageQueueService.onProbandCreated(message.pseudonym)
    );

    await this.createConsumer(
      MessageQueueTopic.PROBAND_LOGGED_IN,
      async (message: ProbandLoggedInMessage) =>
        await MessageQueueService.onProbandLoggedIn(message.pseudonym)
    );
  }

  public async sendQuestionnaireInstanceCreated(
    questionnaireInstance: QuestionnaireInstanceForMessage,
    questionnaire: QuestionnaireForMessage
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
      studyName: questionnaireInstance.study_id,
      pseudonym: questionnaireInstance.user_id,
      status: questionnaireInstance.status,
      questionnaire: {
        id: questionnaire.id,
        customName: questionnaire.custom_name ?? '',
      },
    });
  }

  public async sendQuestionnaireInstanceActivated(
    questionnaireInstance: QuestionnaireInstanceForMessage,
    questionnaire: QuestionnaireForMessage
  ): Promise<void> {
    if (!this.questionnaireInstanceActivatedProducer) {
      throw new Error('connect() must be called before sending messages');
    }

    if (questionnaireInstance.status !== 'active') {
      throw new Error(
        `Instance with id "${questionnaireInstance.id}" has wrong status for sending activated message: ${questionnaireInstance.status}`
      );
    }

    await this.questionnaireInstanceActivatedProducer.publish({
      id: questionnaireInstance.id,
      studyName: questionnaireInstance.study_id,
      pseudonym: questionnaireInstance.user_id,
      status: questionnaireInstance.status,
      questionnaire: {
        id: questionnaire.id,
        customName: questionnaire.custom_name ?? '',
      },
    });
  }

  public async sendQuestionnaireInstanceExpired(
    questionnaireInstance: QuestionnaireInstanceForMessage,
    questionnaire: QuestionnaireForMessage
  ): Promise<void> {
    if (!this.questionnaireInstanceExpiredProducer) {
      throw new Error('connect() must be called before sending messages');
    }

    if (questionnaireInstance.status !== 'expired') {
      throw new Error(
        `Instance with id "${questionnaireInstance.id}" has wrong status for sending expired message: ${questionnaireInstance.status}`
      );
    }

    await this.questionnaireInstanceExpiredProducer.publish({
      id: questionnaireInstance.id,
      studyName: questionnaireInstance.study_id,
      pseudonym: questionnaireInstance.user_id,
      status: questionnaireInstance.status,
      questionnaire: {
        id: questionnaire.id,
        customName: questionnaire.custom_name ?? '',
      },
    });
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
