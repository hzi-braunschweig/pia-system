/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  MessageQueueClient,
  MessageQueueTopic,
  Producer,
  ProbandDeletedMessage,
  ProbandDeactivatedMessage,
  ProbandCreatedMessage,
  StudyDeletedMessage,
  ProbandEmailVerifiedMessage,
  ProbandRegisteredMessage,
} from '@pia/lib-messagequeue';
import { config } from '../config';
import { ProbandDeletionType, ProbandService } from './probandService';
import { StudyService } from './studyService';

export class MessageQueueService extends MessageQueueClient {
  private probandDeleted?: Producer<ProbandDeletedMessage>;
  private probandDeactivated?: Producer<ProbandDeactivatedMessage>;
  private probandCreated?: Producer<ProbandCreatedMessage>;
  private studyDeleted?: Producer<StudyDeletedMessage>;

  public async connect(): Promise<void> {
    await super.connect();
    this.probandDeleted = await this.createProducer<ProbandDeletedMessage>(
      MessageQueueTopic.PROBAND_DELETED
    );
    this.probandDeactivated =
      await this.createProducer<ProbandDeactivatedMessage>(
        MessageQueueTopic.PROBAND_DEACTIVATED
      );
    this.probandCreated = await this.createProducer<ProbandCreatedMessage>(
      MessageQueueTopic.PROBAND_CREATED
    );
    this.studyDeleted = await this.createProducer<StudyDeletedMessage>(
      MessageQueueTopic.STUDY_DELETED
    );

    await this.createConsumer(
      MessageQueueTopic.PROBAND_EMAIL_VERIFIED,
      async (message: ProbandEmailVerifiedMessage) =>
        await this.onProbandEmailVerified(message.pseudonym)
    );

    await this.createConsumer(
      MessageQueueTopic.PROBAND_REGISTERED,
      async (message: ProbandRegisteredMessage) => {
        await ProbandService.createProbandForRegistration(message.username);
      }
    );
  }

  public async onProbandEmailVerified(pseudonym: string): Promise<void> {
    const email = await StudyService.saveVerifiedEmailAddress(pseudonym);
    await StudyService.sendWelcomeMail(pseudonym, email);
  }

  public async sendProbandDeleted(
    pseudonym: string,
    deletionType: ProbandDeletionType,
    studyName: string
  ): Promise<void> {
    if (!this.probandDeleted) {
      throw new Error('not connected to messagequeue');
    }
    await this.probandDeleted.publish({
      pseudonym,
      deletionType,
      studyName,
    });
  }

  public async sendProbandCreated(
    pseudonym: string,
    studyName: string
  ): Promise<void> {
    if (!this.probandCreated) {
      throw new Error('not connected to messagequeue');
    }
    await this.probandCreated.publish({
      pseudonym,
      studyName,
    });
  }

  public async sendProbandDeactivated(
    pseudonym: string,
    studyName: string
  ): Promise<void> {
    if (!this.probandDeactivated) {
      throw new Error('not connected to messagequeue');
    }
    await this.probandDeactivated.publish({
      pseudonym,
      studyName,
    });
  }

  public async sendStudyDeleted(studyName: string): Promise<void> {
    if (!this.studyDeleted) {
      throw new Error('not connected to messagequeue');
    }
    await this.studyDeleted.publish({
      studyName,
    });
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
