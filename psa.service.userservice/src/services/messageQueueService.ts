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
import { ProbandDeletionType, ProbandService } from './probandService';
import { MessagePayloadProbandRegistered } from '../models/messagePayloadProbandRegistered';
import { StudyService } from './studyService';

interface ProbandDeletedMessage extends Message {
  deletionType: ProbandDeletionType;
}

export interface Message {
  pseudonym: string;
}

export class MessageQueueService extends MessageQueueClient {
  private probandDelete?: Producer<ProbandDeletedMessage>;
  private probandDeactivated?: Producer<Message>;
  private probandCreated?: Producer<Message>;

  public async connect(): Promise<void> {
    await super.connect();
    this.probandDelete = await this.createProducer<ProbandDeletedMessage>(
      MessageQueueTopic.PROBAND_DELETED
    );
    this.probandDeactivated = await this.createProducer<Message>(
      MessageQueueTopic.PROBAND_DEACTIVATED
    );
    this.probandCreated = await this.createProducer<Message>(
      MessageQueueTopic.PROBAND_CREATED
    );

    await this.createConsumer(
      MessageQueueTopic.PROBAND_EMAIL_VERIFIED,
      async (message: Message) =>
        await this.onProbandEmailVerified(message.pseudonym)
    );

    await this.createConsumer(
      MessageQueueTopic.PROBAND_REGISTERED,
      async (message: MessagePayloadProbandRegistered) => {
        await ProbandService.createProbandForRegistration(message.username);
      }
    );
  }

  public async onProbandEmailVerified(pseudonym: string): Promise<void> {
    const email = await StudyService.saveVerifiedEmailAddress(pseudonym);
    await StudyService.sendWelcomeMail(pseudonym, email);
  }

  public async sendProbandDelete(
    pseudonym: string,
    deletionType: ProbandDeletionType
  ): Promise<void> {
    if (!this.probandDelete) {
      throw new Error('not connected to messagequeue');
    }
    await this.probandDelete.publish({
      pseudonym,
      deletionType,
    });
  }

  public async sendProbandCreated(pseudonym: string): Promise<void> {
    if (!this.probandCreated) {
      throw new Error('not connected to messagequeue');
    }
    await this.probandCreated.publish({
      pseudonym,
    });
  }

  public async sendProbandDeactivated(pseudonym: string): Promise<void> {
    if (!this.probandDeactivated) {
      throw new Error('not connected to messagequeue');
    }
    await this.probandDeactivated.publish({
      pseudonym,
    });
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
