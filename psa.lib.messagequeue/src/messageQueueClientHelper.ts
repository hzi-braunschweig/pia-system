/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';
import * as util from 'util';

const delay = util.promisify(setTimeout);

export class MessageQueueClientHelper {
  private static readonly DELAY_TIME = 10;

  /**
   * A helper function that can be used to obtain the
   * specific name of a queue.
   * Especially helpfull in integration tests.
   */
  public static getQueueName(topic: string, serviceName: string): string {
    return `${topic}@${serviceName}`;
  }

  /**
   * A helper function that can be used to obtain the
   * specific name of a dead letter queue.
   * Especially helpfull in integration tests.
   */
  public static getDeadLetterQueueName(
    topic: string,
    serviceName: string
  ): string {
    return `${topic}@${serviceName}-dead-letter`;
  }

  /**
   * A helper function that can be used to wait until the
   * message queue host is fully available.
   */
  public static async waitForAvailability(options: {
    host: string;
    port?: number;
    username: string;
    password: string;
  }): Promise<void> {
    for (;;) {
      try {
        const connection = await amqp.connect({
          hostname: options.host,
          port: options.port,
          username: options.username,
          password: options.password,
        });
        await connection.close();

        return;
      } catch {
        await delay(this.DELAY_TIME);
      }
    }
  }
}
