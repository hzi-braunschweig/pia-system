/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueClient } from '@pia/lib-messagequeue';
import { config } from '../config';
import { NotificationHandlers } from './notificationHandlers';

interface ProbandMessage {
  pseudonym: string;
}

export class MessageQueueService extends MessageQueueClient {
  private static async onProbandDeleted(pseudonym: string): Promise<void> {
    await NotificationHandlers.handleProbandDeleted(pseudonym);
    console.log('processed proband.deleted');
  }

  private static async onProbandCreated(pseudonym: string): Promise<void> {
    await NotificationHandlers.handleProbandCreated(pseudonym);
    console.log('processed proband.created');
  }

  private static async onProbandLoggedIn(pseudonym: string): Promise<void> {
    await NotificationHandlers.handleLoginOfProband(pseudonym);
    console.log('processed proband.logged_in');
  }

  public async connect(): Promise<void> {
    await super.connect();

    await this.createConsumer(
      'proband.deleted',
      async (message: ProbandMessage) =>
        await MessageQueueService.onProbandDeleted(message.pseudonym)
    );

    await this.createConsumer(
      'proband.created',
      async (message: ProbandMessage) =>
        await MessageQueueService.onProbandCreated(message.pseudonym)
    );

    await this.createConsumer(
      'proband.logged_in',
      async (message: ProbandMessage) =>
        await MessageQueueService.onProbandLoggedIn(message.pseudonym)
    );
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
