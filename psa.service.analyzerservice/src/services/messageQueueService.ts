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
} from '@pia/lib-messagequeue';
import { config } from '../config';
import { NotificationHandlers } from './notificationHandlers';
import { performance } from 'perf_hooks';

export class MessageQueueService extends MessageQueueClient {
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
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
