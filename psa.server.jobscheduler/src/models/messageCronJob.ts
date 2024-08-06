/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CronJob } from 'cron';
import { MessageQueueTopic } from '@pia/lib-messagequeue';
import { messageQueueService } from '../services/messageQueueService';

class MessageCronJob extends CronJob {
  public readonly topic: MessageQueueTopic;

  public constructor(topic: MessageQueueTopic, cronTime: string) {
    super(cronTime, async () => {
      await messageQueueService.publishMessageForTopic(topic);
    });
    this.topic = topic;
  }
}

export default MessageCronJob;
