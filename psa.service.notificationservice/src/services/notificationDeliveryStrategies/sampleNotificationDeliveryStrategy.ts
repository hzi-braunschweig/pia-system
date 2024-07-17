/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import NotificationDeliveryStrategy from './notificationDeliveryStrategy';
import { Schedule } from '../../models/schedule';
import * as postgresqlHelper from '../postgresqlHelper';
import { personaldataserviceClient } from '../../clients/personaldataserviceClient';
import NotificationHelper from '../notificationHelper';
import { MailService } from '@pia/lib-service-core';
import { LabResult } from '../../models/labResult';
import { FcmToken } from '../../models/fcmToken';
import SampleNotificationContentStrategy from '../notificationContentStrategies/sampleNotificationContentStrategy';

export default class SampleNotificationDeliveryStrategy
  implements NotificationDeliveryStrategy
{
  public async deliverNotification(
    schedule: Schedule,
    contentStrategy: SampleNotificationContentStrategy
  ): Promise<void> {
    const labResult = (await postgresqlHelper.getLabResult(
      schedule.reference_id
    )) as LabResult;
    const tokens = (await postgresqlHelper.getToken(
      schedule.user_id
    )) as FcmToken[];

    const sendNotification = tokens.length > 0;
    const sendMail = !sendNotification;

    let didSendReminder = false;
    try {
      if (sendNotification) {
        const success = await NotificationHelper.sendNotifications({
          recipient: schedule.user_id,
          tokens,
          notificationId: schedule.id,
          updateTimeForNotification: true,
          type: `sample id (${labResult.id})`,
        });
        if (success) {
          didSendReminder = true;
        }
      }
      if (sendMail) {
        console.log(
          'Sending labresult email for: ' +
            schedule.reference_id +
            ' to: ' +
            schedule.user_id
        );

        const email = await personaldataserviceClient
          .getPersonalDataEmail(schedule.user_id)
          .catch(() => {
            console.log('User has no email address');
            return null;
          });

        if (email) {
          contentStrategy.initialize(labResult);
          await MailService.sendMail(email, contentStrategy.getEmailContent());

          console.log(
            'Successfully sent email to user: ' +
              schedule.user_id +
              ' for sample id: ' +
              schedule.reference_id
          );
          await postgresqlHelper.deleteScheduledNotification(schedule.id);
          didSendReminder = true;
        }
      }
    } catch (e) {
      console.log(e);
    }
    if (!didSendReminder) {
      console.log(
        'Error sending notification AND email to user: ' +
          schedule.user_id +
          ' for sample id: ' +
          schedule.reference_id,
        ', postponing it'
      );
      await postgresqlHelper.postponeNotification(schedule.id);
    }
  }
}
