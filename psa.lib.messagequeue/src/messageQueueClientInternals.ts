/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';

export interface HandleMessageArgs<M> {
  message: amqp.ConsumeMessage;
  onMessage: (message: M) => Promise<void>;
  channel: amqp.Channel;
  topic: string;
  deadLetterQueue: amqp.Replies.AssertQueue;
}
