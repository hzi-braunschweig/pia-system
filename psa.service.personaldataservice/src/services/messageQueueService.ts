/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueClient, MessageQueueTopic } from '@pia/lib-messagequeue';
import { config } from '../config';
import { runTransaction } from '../db';
import { PendingDeletionRepository } from '../repositories/pendingDeletionRepository';
import { PersonalDataRepository } from '../repositories/personalDataRepository';

export class MessageQueueService extends MessageQueueClient {
  private static async onProbandDeleted(pseudonym: string): Promise<void> {
    return runTransaction(async (transaction) => {
      await PendingDeletionRepository.deletePendingDeletion(pseudonym, {
        transaction,
      });
      await PersonalDataRepository.deletePersonalData(pseudonym, {
        transaction,
      });
    });
  }

  public async connect(): Promise<void> {
    await super.connect();

    await this.createConsumer(
      MessageQueueTopic.PROBAND_DELETED,
      async (message) =>
        await MessageQueueService.onProbandDeleted(message.pseudonym)
    );
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
