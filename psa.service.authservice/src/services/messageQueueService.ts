/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueClient, Producer } from '@pia/lib-messagequeue';
import { config } from '../config';

interface ProbandLoggedInMessage {
  pseudonym: string;
}

export class MessageQueueService extends MessageQueueClient {
  private probandLoggedIn?: Producer<ProbandLoggedInMessage>;

  public async connect(): Promise<void> {
    await super.connect();

    this.probandLoggedIn = await this.createProducer<ProbandLoggedInMessage>(
      'proband.logged_in'
    );
  }

  public async sendProbandLoggedIn(pseudonym: string): Promise<void> {
    if (!this.probandLoggedIn) {
      throw new Error('not connected to messagequeue');
    }
    await this.probandLoggedIn.publish({ pseudonym });
  }
}

export const messageQueueService = new MessageQueueService(
  config.servers.messageQueue
);
