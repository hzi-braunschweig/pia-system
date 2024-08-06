/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueClient, MessageQueueTopic } from '@pia/lib-messagequeue';
import { config } from '../config';
import * as postgresqlHelper from './postgresqlHelper';

export class MessageQueueService extends MessageQueueClient {
  public static async onProbandDeactivated(pseudonym: string): Promise<void> {
    await postgresqlHelper.removeFCMTokenForPseudonym(pseudonym);
    await postgresqlHelper.deleteScheduledNotificationByUserId(pseudonym);
  }

  public static async onProbandDeleted(pseudonym: string): Promise<void> {
    await postgresqlHelper.removeFCMTokenForPseudonym(pseudonym);
    await postgresqlHelper.deleteScheduledNotificationByUserId(pseudonym);
  }

  public async connect(): Promise<void> {
    await super.connect();

    await this.createConsumer(
      MessageQueueTopic.PROBAND_DEACTIVATED,
      async (message) =>
        await MessageQueueService.onProbandDeactivated(message.pseudonym)
    );

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
