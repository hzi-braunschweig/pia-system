/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Schedule } from '../../models/schedule';
import * as postgresqlHelper from '../postgresqlHelper';
import { MailService } from '@pia/lib-service-core';
import NotificationDeliveryStrategy from './notificationDeliveryStrategy';
import DefaultNotificationContentStrategy from '../notificationContentStrategies/defaultNotificationContentStrategy';

export default class QuestionnairesStatsAggregatorNotificationDeliveryStrategy
  implements NotificationDeliveryStrategy
{
  public async deliverNotification(
    schedule: Schedule,
    contentStrategy: DefaultNotificationContentStrategy
  ): Promise<void> {
    console.log(
      `Sending questionnaires_stats_aggregator notification with id ${schedule.id}`
    );
    try {
      const emailTo = schedule.reference_id;
      if (emailTo) {
        contentStrategy.initialize(schedule);
        await MailService.sendMail(emailTo, contentStrategy.getEmailContent());
        console.log(
          'Successfully sent email for schedule notification with id ',
          schedule.id
        );
        await postgresqlHelper.deleteScheduledNotification(schedule.id);
      } else {
        console.log('user has no email address');
      }
    } catch (e) {
      console.log(e);
    }
  }
}
