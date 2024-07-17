/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import NotificationDeliveryStrategy from './notificationDeliveryStrategy';
import { questionnaireserviceClient } from '../../clients/questionnaireserviceClient';
import { Boom } from '@hapi/boom';
import { StatusCodes } from 'http-status-codes';
import { Schedule } from '../../models/schedule';
import * as postgresqlHelper from '../postgresqlHelper';
import { QuestionnaireInstance } from '../../models/questionnaireInstance';
import { personaldataserviceClient } from '../../clients/personaldataserviceClient';
import NotificationHelper from '../notificationHelper';
import { MailService } from '@pia/lib-service-core';
import ReminderNotificationContentStrategy from '../notificationContentStrategies/reminderNotificationContentStrategy';

export default class ReminderNotificationDeliveryStrategy
  implements NotificationDeliveryStrategy
{
  public async deliverNotification(
    schedule: Schedule,
    contentStrategy: ReminderNotificationContentStrategy
  ): Promise<void> {
    const instance = await this.getQuestionnaireInstance(schedule);

    if (this.shouldDeleteNotification(instance)) {
      console.log(
        `The questionnaire instance of that notification schedule is not longer present, hase been released or is expired, deleting schedule for instance: ${schedule.reference_id}`
      );
      await this.deleteNotification(schedule);
      return;
    }

    if (this.shouldPostponeNotification(instance)) {
      console.log(
        `The questionnaire of that notification schedule is empty because of conditions, postponing schedule for instance: ${schedule.reference_id}`
      );
      await this.postponeNotification(schedule);
      return;
    }

    if (this.shouldSendNotification(instance)) {
      let didSendReminder = false;

      try {
        didSendReminder = await this.sendPushNotifications(schedule, instance);
        if (!didSendReminder) {
          didSendReminder = await this.sendEmailNotification(
            schedule,
            instance,
            contentStrategy
          );
        }
      } catch (e) {
        console.log(e);
      }

      if (!didSendReminder) {
        console.log(
          `Error sending either notification or email to user: ${instance.pseudonym} for instance id: ${instance.id}, postponing it`
        );
        await this.postponeNotification(schedule);
      }
    }

    return Promise.resolve(undefined);
  }

  private async getQuestionnaireInstance(
    schedule: Schedule
  ): Promise<QuestionnaireInstance | null> {
    return questionnaireserviceClient
      .getQuestionnaireInstance(Number.parseInt(schedule.reference_id), true)
      .catch((err) => {
        if (
          err instanceof Boom &&
          err.output.statusCode === StatusCodes.NOT_FOUND
        ) {
          return null;
        } else {
          throw err;
        }
      });
  }

  private shouldPostponeNotification(
    instance: QuestionnaireInstance | null
  ): boolean {
    return !!instance && instance.questionnaire.questions.length === 0;
  }

  private shouldSendNotification(
    instance: QuestionnaireInstance | null
  ): instance is QuestionnaireInstance {
    return instance?.status === 'active' || instance?.status === 'in_progress';
  }

  private shouldDeleteNotification(
    instance: QuestionnaireInstance | null
  ): boolean {
    return (
      !instance ||
      instance.status === 'released_once' ||
      instance.status === 'released_twice' ||
      instance.status === 'expired'
    );
  }

  private async postponeNotification(schedule: Schedule): Promise<void> {
    await postgresqlHelper.postponeNotificationByInstanceId(
      schedule.reference_id
    );
  }

  private async deleteNotification(schedule: Schedule): Promise<void> {
    await postgresqlHelper.deleteScheduledNotificationByInstanceId(
      schedule.reference_id
    );
  }

  private async sendPushNotifications(
    schedule: Schedule,
    instance: QuestionnaireInstance
  ): Promise<boolean> {
    const tokens = await NotificationHelper.getFcmTokensForUser(
      schedule.user_id
    );
    const userCanReceivePushNotifications = tokens.length > 0;

    if (!userCanReceivePushNotifications) {
      return false;
    }

    let numberOfOpenQuestionnairesForBadge: number | undefined;
    try {
      numberOfOpenQuestionnairesForBadge =
        (await postgresqlHelper.countOpenQuestionnaireInstances(
          schedule.user_id
        )) as number;
    } catch (e) {
      console.log('Could not fetch QI count', e);
    }

    return NotificationHelper.sendNotifications({
      recipient: instance.pseudonym,
      tokens,
      notificationId: schedule.id,
      badgeNumber: numberOfOpenQuestionnairesForBadge,
      updateTimeForNotification: true,
      type: `instance id (${instance.id})`,
    });
  }

  private async sendEmailNotification(
    schedule: Schedule,
    instance: QuestionnaireInstance,
    contentStrategy: ReminderNotificationContentStrategy
  ): Promise<boolean> {
    console.log(
      `Sending email to user: ${instance.pseudonym} for instance id: ${instance.id}`
    );

    const emailAddress = await personaldataserviceClient
      .getPersonalDataEmail(instance.pseudonym)
      .catch((e) => {
        console.error('Error at retrieving user email address: ', e);
        return null;
      });

    if (emailAddress) {
      contentStrategy.initialize(instance);

      await MailService.sendMail(
        emailAddress,
        contentStrategy.getEmailContent()
      );

      console.log(
        `Successfully sent email to user: ${instance.pseudonym} for instance id: ${instance.id}`
      );
      await postgresqlHelper.deleteScheduledNotification(schedule.id);

      return true;
    }

    console.log('User has no email address');
    return false;
  }
}
