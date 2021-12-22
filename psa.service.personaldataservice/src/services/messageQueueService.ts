/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueClient } from '@pia/lib-messagequeue';
import { config } from '../config';
import { runTransaction } from '../db';
import pendingDeletionRepository from '../repositories/pendingDeletionRepository';
import { PersonalDataRepository } from '../repositories/personalDataRepository';

interface ProbandDeletedMessage {
  pseudonym: string;
  deletionType:
    | 'default' // delete all proband data but keep the pseudonym
    | 'keep_usage_data' // delete all proband data but keep usage data like logs and the pseudonym
    | 'full'; // fully delete all proband data
}

export class MessageQueueService extends MessageQueueClient {
  private static async onProbandDeleted(pseudonym: string): Promise<void> {
    return runTransaction(async (transaction) => {
      await pendingDeletionRepository.deletePendingDeletion(pseudonym, {
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
      'proband.deleted',
      async (message: ProbandDeletedMessage) =>
        await MessageQueueService.onProbandDeleted(message.pseudonym)
    );
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
