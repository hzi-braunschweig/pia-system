/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';
import { MessageQueueTopic } from './messageQueueTopics';

export interface HandleMessageArgs<M> {
  message: amqp.ConsumeMessage;
  onMessage: (message: M) => Promise<void>;
  channel: amqp.Channel;
  topic: MessageQueueTopic;
  deadLetterQueue: amqp.Replies.AssertQueue;
}
