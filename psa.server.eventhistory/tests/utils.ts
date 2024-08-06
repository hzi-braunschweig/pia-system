/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { messageQueueService } from '../src/services/messageQueueService';
import {
  MessageQueueClient,
  MessageQueueTestUtils,
  MessageQueueTopic,
  MessageTopicMap,
} from '@pia/lib-messagequeue';

export async function produceMessage<T extends MessageQueueTopic>(
  mqc: MessageQueueClient,
  topic: T,
  message: MessageTopicMap[T] = {} as MessageTopicMap[T]
): Promise<void> {
  const promisedMessage = MessageQueueTestUtils.injectMessageProcessedAwaiter(
    messageQueueService,
    topic
  );

  const producer = await mqc.createProducer(topic);
  await producer.publish(message);

  await promisedMessage;
}
