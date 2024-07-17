/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import NotificationDeliveryStrategy from './notificationDeliveryStrategy';
import { Schedule } from '../../models/schedule';
import * as postgresqlHelper from '../postgresqlHelper';
import NotificationHelper from '../notificationHelper';
import { FcmToken } from '../../models/fcmToken';

export default class CustomNotificationDeliveryStrategy
  implements NotificationDeliveryStrategy
{
  public async deliverNotification(schedule: Schedule): Promise<void> {
    const tokens = (await postgresqlHelper.getToken(
      schedule.user_id
    )) as FcmToken[];

    await NotificationHelper.sendNotifications({
      recipient: schedule.user_id,
      tokens,
      notificationId: schedule.id,
      postponeOnException: true,
      updateTimeForNotification: true,
      type: 'scheduled custom',
    });
  }
}
