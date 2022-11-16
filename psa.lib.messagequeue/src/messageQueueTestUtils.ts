/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueClient } from './messageQueueClient';
import { HandleMessageArgs } from './messageQueueClientInternals';
import { MessageQueueTopic } from './messageQueueTopics';

type HandleMessage = (args: HandleMessageArgs<unknown>) => Promise<void>;

interface MessageQueueClientPrivate {
  handleMessage: HandleMessage;
}

interface Sandbox {
  replace: <T, TKey extends keyof T>(
    obj: T,
    prop: TKey,
    replacement: T[TKey]
  ) => T[TKey];
}

/**
 * Utils for testing the MessageQueue.
 * ONLY USE THIS FOR TESTS!
 */
export class MessageQueueTestUtils {
  /**
   * A helper function that can be used to wait until a message of a topic is processed.
   * Only use this in integration tests!
   */
  public static async injectMessageProcessedAwaiter(
    messageQueueClient: MessageQueueClient,
    topic: MessageQueueTopic,
    sandbox?: Sandbox
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const mqcp = messageQueueClient as unknown as MessageQueueClientPrivate;

      const original: HandleMessage = mqcp.handleMessage;
      const replacement: HandleMessage = async (
        args: HandleMessageArgs<unknown>
      ) => {
        await original(args);
        if (args.topic === topic) {
          // if not in a sandbox we will restore the original method on the first call
          if (!sandbox) {
            mqcp.handleMessage = original;
          }
          resolve();
        }
      };

      if (sandbox) {
        sandbox.replace(mqcp, 'handleMessage', replacement);
      } else {
        mqcp.handleMessage = replacement;
      }
    });
  }
}
