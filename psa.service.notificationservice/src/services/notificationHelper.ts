/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { addDays, addHours, set } from 'date-fns';

import * as postgresqlHelper from './postgresqlHelper';
import { FcmHelper } from './fcmHelper';
import { config } from '../config';
import { User } from '../models/user';
import { LabResult } from '../models/labResult';
import { DbNotificationSchedules } from '../models/notification';
import { DbAnswer } from '../models/answer';
import { DbQuestionnaire } from '../models/questionnaire';
import { FcmToken } from '../models/fcmToken';
import { zonedTimeToUtc } from 'date-fns-tz';
import { FirebaseMessageRejectedError } from '../errors';

/**
 * A collection of methods to help scheduling and sending notifications
 */
export class NotificationHelper {
  /**
   * creates dates for push notifications
   */
  public static createDatesForUserNotification(
    questionnaireSettings: DbQuestionnaire,
    dateOfIssue: Date
  ): Date[] {
    const sendDates = [];

    const notification_interval_unit =
      questionnaireSettings.notification_interval_unit
        ? questionnaireSettings.notification_interval_unit
        : 'days';
    const notification_interval = questionnaireSettings.notification_interval
      ? questionnaireSettings.notification_interval
      : 1;

    for (let i = 0; i < questionnaireSettings.notification_tries; i++) {
      const notificationTime = set(new Date(), config.notificationTime);
      let newDate = null;

      // Use instance date as reference
      if (questionnaireSettings.cycle_unit === 'hour') {
        newDate =
          notification_interval_unit === 'days'
            ? addDays(new Date(dateOfIssue), i * notification_interval)
            : addHours(new Date(dateOfIssue), i * notification_interval);
      }

      // Use notification time as reference
      else if (notification_interval_unit === 'days') {
        newDate = addDays(notificationTime, i * notification_interval);
      } else if (notification_interval_unit === 'hours') {
        newDate = addHours(notificationTime, i * notification_interval);
      }

      if (newDate) sendDates.push(newDate);
    }

    return sendDates;
  }

  public static async createNotification(
    date: Date,
    user_id: string,
    type: string,
    reference_id: string
  ): Promise<void> {
    const notificationSchedule = [user_id, date, type, reference_id];
    await postgresqlHelper.insertNotificationSchedule(notificationSchedule);
  }

  /**
   * creates a custom a schedule for a custom notification
   */
  public static async createCustomNotification(
    date: Date | null,
    user_id: string,
    reference_id: string,
    title: string,
    body: string
  ): Promise<DbNotificationSchedules> {
    const notificationSchedule = [
      user_id,
      date,
      'custom',
      reference_id,
      title,
      body,
    ];
    return (await postgresqlHelper.insertCustomNotificationSchedule(
      notificationSchedule
    )) as DbNotificationSchedules;
  }

  /**
   * creates a custom a schedule for a notable answer notification
   */
  public static async createNotableAnswerNotification(
    email: string,
    date: Date,
    title: string,
    body: string
  ): Promise<void> {
    const notificationSchedule = [
      null,
      date,
      'questionnaires_stats_aggregator',
      email,
      title,
      body,
    ];
    await postgresqlHelper.insertCustomNotificationSchedule(
      notificationSchedule
    );
  }

  /**
   * handles updates to a lab result
   */
  public static async handleUpdatedLabResult(
    oldResult: LabResult,
    newResult: LabResult
  ): Promise<void> {
    if (oldResult.status !== 'analyzed' && newResult.status === 'analyzed') {
      const userComplicanceLabresults =
        (await postgresqlHelper.getUserComplianceLabresults(
          newResult.user_id
        )) as User;
      if (userComplicanceLabresults.compliance_labresults) {
        const zonedSendDate = set(new Date(), config.notificationTime);
        const sendDate = zonedTimeToUtc(zonedSendDate, config.timeZone);
        console.log(
          `New labresult was analysed, scheduling notification to: ${
            newResult.user_id
          } at: ${sendDate.toString()}`
        );
        await NotificationHelper.createNotification(
          sendDate,
          newResult.user_id,
          'sample',
          newResult.id
        );
      }
    }
  }

  /**
   * handles updates to a questionnaire instance answer
   */
  public static async questionnaireInstanceHasNotableAnswers(
    questionnaireInstanceId: number
  ): Promise<void> {
    const hasAnswersNotifyFeature =
      await postgresqlHelper.hasAnswersNotifyFeature(questionnaireInstanceId);
    if (hasAnswersNotifyFeature) {
      const answers = (await postgresqlHelper.getQuestionnaireInstanceAnswers(
        questionnaireInstanceId
      )) as DbAnswer[];
      for (const answer of answers) {
        const isNotableAnswer = (await postgresqlHelper.isNotableAnswer(
          answer.answer_option_id,
          answer.value
        )) as boolean;
        if (isNotableAnswer) {
          await postgresqlHelper.insertContactProbandRecordForNotableAnswer(
            questionnaireInstanceId
          );
          break;
        }
      }
    }
  }

  public static async getFcmTokensForUser(userId: string): Promise<FcmToken[]> {
    return (await postgresqlHelper.getToken(userId)) as FcmToken[];
  }

  public static async sendNotifications({
    tokens,
    recipient,
    notificationId,
    postponeOnException,
    badgeNumber,
    updateTimeForNotification,
    type,
  }: {
    recipient: string;
    tokens: FcmToken[];
    notificationId: number;
    postponeOnException?: boolean;
    badgeNumber?: number;
    updateTimeForNotification?: boolean;
    type: string;
  }): Promise<boolean> {
    if (tokens.length <= 0) {
      console.info(
        `Notification to ${recipient} is not sent due to a missing token. Skipping.`
      );
      return false;
    }

    console.log(
      `Sending ${type} notification to: ${recipient} (${tokens.length} token)`
    );

    let numSendMessages = 0;
    for (const token of tokens) {
      try {
        if (
          await NotificationHelper.sendNotification({
            recipient,
            token,
            notificationId,
            postponeOnException,
            badgeNumber,
            type,
          })
        ) {
          numSendMessages++;
        }
      } catch (e) {
        console.log(e);
      }
    }

    if (numSendMessages > 0) {
      console.log(
        `Successfully sent ${type} notification to: ${recipient} (${numSendMessages}/${tokens.length} token were notified successfully)`
      );
      if (updateTimeForNotification) {
        await postgresqlHelper.updateTimeForNotification(notificationId, null);
      }
    } else {
      console.log(
        `Failed to sent ${type} notification to: ${recipient} (none of ${tokens.length} token were notified successfully)`
      );
    }
    return numSendMessages > 0;
  }

  public static async sendNotification({
    token,
    notificationId,
    badgeNumber,
    postponeOnException,
    recipient,
    type,
  }: {
    recipient: string;
    token: FcmToken;
    notificationId: number;
    postponeOnException?: boolean;
    badgeNumber?: number;
    type: string;
  }): Promise<boolean> {
    try {
      await FcmHelper.sendDefaultNotification(
        token.token,
        notificationId,
        badgeNumber
      );
    } catch (error: unknown) {
      if (error instanceof FirebaseMessageRejectedError) {
        console.log(
          `Could not send ${type} notification to: ${recipient} got rejected - deleting token`
        );
        console.log(error);
        await postgresqlHelper.removeFCMToken(token.token);
        return false;
      }

      if (postponeOnException) {
        console.log(
          `Could not send ${type} notification to: ${recipient}, postponing it`
        );
        console.log(error);
        await postgresqlHelper.postponeNotificationByOneHour(notificationId);
      } else {
        console.log(`Could not send ${type} notification to: ${recipient}`);
        console.log(error);
      }

      return false;
    }

    return true;
  }
}

export default NotificationHelper;
