/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import MessageCronJob from '../models/messageCronJob';
import { MessageQueueTopic } from '@pia/lib-messagequeue';

export class CronService {
  public readonly cronJobs: MessageCronJob[] = [];

  public setup(cronTable: Map<MessageQueueTopic, string>): void {
    for (const [topic, cronTime] of cronTable.entries()) {
      this.cronJobs.push(new MessageCronJob(topic, cronTime));
      console.log(
        `CronJob for topic ${topic} created with cronTime ${cronTime}`
      );
    }
  }

  public startAll(): void {
    for (const cronJob of this.cronJobs) {
      cronJob.start();
      console.log(`CronJob for topic ${cronJob.topic} started`);
    }
  }

  public stopAll(): void {
    for (const cronJob of this.cronJobs) {
      cronJob.stop();
      console.log(`CronJob for topic ${cronJob.topic} stopped`);
    }
  }
}
