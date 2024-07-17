/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as schedule from 'node-schedule';
import postgresqlHelper from '../services/postgresqlHelper';
import { Schedule } from '../models/schedule';
import { ExecutionTime, asyncForEachParallel } from '@pia/lib-service-core';
import {
  NotificationDeliveryStrategies,
  NotificationContentStrategies,
} from '../strategies';
import Cronjob from './cronjob';
import { config } from '../config';

/**
 * Send all due notifications
 */
export default class SendScheduledNotificationsCronjob implements Cronjob {
  public start(): schedule.Job {
    // Every 10 minutes
    const start = 0;
    const end = 59;
    const step = 10;
    const rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(start, end, step);

    return schedule.scheduleJob(rule, () => {
      void this.execute();
    });
  }

  public async execute(): Promise<void> {
    const scheduledNotifications =
      (await postgresqlHelper.getAllDueNotifications()) as Schedule[];

    const maxParallel = config.scheduleNotificationSendingMaxParallel;
    console.log(
      `Found ${scheduledNotifications.length} scheduled notifications; sending ${maxParallel} in parallel`
    );

    const executionTime = new ExecutionTime();
    await asyncForEachParallel(
      scheduledNotifications,
      async (notificationSchedule) => {
        const deliveryStrategy =
          NotificationDeliveryStrategies[
            notificationSchedule.notification_type
          ];
        const contentStrategy =
          NotificationContentStrategies[notificationSchedule.notification_type];

        try {
          await deliveryStrategy.deliverNotification(
            notificationSchedule,
            contentStrategy
          );
        } catch (e) {
          console.log(e);
        }
      },
      maxParallel
    );

    console.log(
      `sending of all open notifications ${executionTime.toString()} while sending ${maxParallel} in parallel`
    );
  }
}
