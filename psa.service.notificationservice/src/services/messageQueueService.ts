/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueClient, MessageQueueTopic } from '@pia/lib-messagequeue';
import { config } from '../config';
import * as postgresqlHelper from './postgresqlHelper';
import {
  MessagePayloadProbandDeactivated,
  MessagePayloadProbandDeleted,
} from '../models/messagePayloads';

export class MessageQueueService extends MessageQueueClient {
  public static async onProbandDeactivated(pseudonym: string): Promise<void> {
    await postgresqlHelper.removeFCMTokenForPseudonym(pseudonym);
  }

  public static async onProbandDeleted(pseudonym: string): Promise<void> {
    await postgresqlHelper.removeFCMTokenForPseudonym(pseudonym);
  }

  public async connect(): Promise<void> {
    await super.connect();

    await this.createConsumer(
      MessageQueueTopic.PROBAND_DEACTIVATED,
      async (message: MessagePayloadProbandDeactivated) =>
        await MessageQueueService.onProbandDeactivated(message.pseudonym)
    );

    await this.createConsumer(
      MessageQueueTopic.PROBAND_DELETED,
      async (message: MessagePayloadProbandDeleted) =>
        await MessageQueueService.onProbandDeleted(message.pseudonym)
    );
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
