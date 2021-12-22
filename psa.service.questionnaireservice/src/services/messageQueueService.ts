/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { config } from '../config';
import { MessageQueueClient, Producer } from '@pia/lib-messagequeue';
import { getRepository } from 'typeorm';
import { QuestionnaireInstance } from '../entities/questionnaireInstance';
import {
  MessagePayloadProbandDeactivated,
  MessagePayloadQuestionnaireInstanceReleased,
} from '../models/messagePayloads';

export class MessageQueueService extends MessageQueueClient {
  private questionnaireinstanceReleasedProducer?: Producer<MessagePayloadQuestionnaireInstanceReleased>;

  public static async onUserDeactivated(
    message: MessagePayloadProbandDeactivated
  ): Promise<void> {
    await getRepository(QuestionnaireInstance).delete({
      pseudonym: message.pseudonym,
      status: 'inactive',
    });
  }

  public async connect(): Promise<void> {
    await super.connect();

    await this.createConsumer(
      'proband.deactivated',
      async (message: MessagePayloadProbandDeactivated) => {
        await MessageQueueService.onUserDeactivated(message);
      }
    );

    this.questionnaireinstanceReleasedProducer =
      await this.createProducer<MessagePayloadQuestionnaireInstanceReleased>(
        'questionnaire_instance.released'
      );
  }

  public async sendQuestionnaireInstanceReleased(
    id: number,
    releaseVersion: number
  ): Promise<void> {
    if (!this.questionnaireinstanceReleasedProducer) {
      throw new Error('not connected to messagequeue');
    }
    await this.questionnaireinstanceReleasedProducer.publish({
      id,
      releaseVersion,
    });
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
