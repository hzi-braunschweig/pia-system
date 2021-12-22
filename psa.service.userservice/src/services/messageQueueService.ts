/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueClient, Producer } from '@pia/lib-messagequeue';
import { config } from '../config';
import { ProbandDeletionType } from './probandService';

interface ProbandDeletedMessage extends Message {
  deletionType: ProbandDeletionType;
}

interface Message {
  pseudonym: string;
}

class MessageQueueService extends MessageQueueClient {
  private probandDelete?: Producer<ProbandDeletedMessage>;
  private probandDeactivated?: Producer<Message>;
  private probandCreated?: Producer<Message>;

  public async connect(): Promise<void> {
    await super.connect();
    this.probandDelete = await this.createProducer<ProbandDeletedMessage>(
      'proband.deleted'
    );
    this.probandDeactivated = await this.createProducer<Message>(
      'proband.deactivated'
    );
    this.probandCreated = await this.createProducer<Message>('proband.created');
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
