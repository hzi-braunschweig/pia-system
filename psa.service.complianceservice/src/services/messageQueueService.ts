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

interface Message {
  pseudonym: string;
}

class MessageQueueService extends MessageQueueClient {
  private complianceCreate?: Producer<Message>;

  public async connect(): Promise<void> {
    await super.connect();
    this.complianceCreate = await this.createProducer<Message>(
      MessageQueueTopic.COMPLIANCE_CREATED
    );
  }

  public async sendComplianceCreate(pseudonym: string): Promise<void> {
    if (!this.complianceCreate) {
      throw new Error('not connected to messagequeue');
    }
    await this.complianceCreate.publish({
      pseudonym,
    });
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
