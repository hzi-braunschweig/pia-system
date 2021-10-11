/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as Boom from '@hapi/boom';
import { AccessToken } from '@pia/lib-service-core';
import postgresqlHelper from '../services/postgresqlHelper';

import { isValid, addHours } from 'date-fns';
import { NotificationHelper } from '../services/notificationHelper';

import { FcmToken } from '../models/fcmToken';
import { Notification, DbNotificationSchedules } from '../models/notification';
import { QuestionnaireInstance } from '../models/questionnaireInstance';

import { QuestionnaireserviceClient } from '../clients/questionnaireserviceClient';
import { assert } from 'ts-essentials';
import StatusCodes from 'http-status-codes';
import { UserserviceClient } from '../clients/userserviceClient';

/**
 * @description interactor that handles notification requests based on users permissions
 */
export class NotificationInteractor {
  /**
   * @description creates a new notification based on the users permissions
   * @param {string} userToken the jwt of the request
   * @param {string} notification the fcm notification to create
   * @returns object promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async createNotification(
    decodedToken: Partial<AccessToken>,
    notification: Notification
  ): Promise<{ success: boolean }> {
    const failedSendTo: string[] = [];
    const notLoggedIn: string[] = [];
    const notificationDate =
      notification.date && isValid(notification.date)
        ? new Date(notification.date)
        : addHours(new Date(), 1);

    if (decodedToken.role !== 'ProbandenManager') {
      throw Boom.forbidden('Unknown or wrong role');
    }

    // Create notification for each recipient
    for (const recipient of notification.recipients) {
      await NotificationInteractor.processNotificationForRecipient(
        recipient,
        notification,
        failedSendTo,
        notLoggedIn,
        notificationDate,
        decodedToken.groups ?? []
      );
    }

    return {
      success: notification.recipients.some(
        (recipient) =>
          !failedSendTo.includes(recipient) && !notLoggedIn.includes(recipient)
      ),
    };
  }

  /**
   * @description get notification with id
   * @param {string} userToken the jwt of the request
   * @param {string} notification_id the fcm notification id
   * @returns object promise a promise that will be resolved in case of success or rejected otherwise
   */
  public static async getNotification(
    decodedToken: Partial<AccessToken>,
    notification_id: number
  ): Promise<{
    notification_type: 'qReminder' | 'sample' | 'custom';
    reference_id: string;
    title: string | null;
    body: string | null;
    questionnaire_id?: number;
    questionnaire_version?: number;
  }> {
    if (decodedToken.role !== 'Proband') {
      throw Boom.notFound(
        'Could not get notification, because user role is not valid'
      );
    }

    let resultNotificationByID: DbNotificationSchedules;
    try {
      resultNotificationByID = (await postgresqlHelper.getNotificationById(
        notification_id
      )) as DbNotificationSchedules;
    } catch (err) {
      console.error(err);
      throw Boom.notFound(
        'Could not get notification, because it does not exist'
      );
    }

    if (decodedToken.username !== resultNotificationByID.user_id) {
      throw Boom.notFound(
        'Could not get notification: User hast no right to see this notification'
      );
    }

    assert(typeof resultNotificationByID.reference_id === 'string');

    switch (resultNotificationByID.notification_type) {
      case 'qReminder': {
        let qInstance: QuestionnaireInstance;
        try {
          qInstance = await QuestionnaireserviceClient.getQuestionnaireInstance(
            Number.parseInt(resultNotificationByID.reference_id)
          );
        } catch (err) {
          if (
            err instanceof Boom.Boom &&
            err.output.statusCode === StatusCodes.NOT_FOUND
          ) {
            throw Boom.notFound('Could not get questionnaire instance');
          } else throw err;
        }

        if (qInstance.questionnaire.questions.length === 0) {
          throw Boom.notFound('Conditions of questionnaire are not fulfilled');
        }

        let notification_body;
        if (qInstance.status === 'active') {
          notification_body = qInstance.questionnaire.notification_body_new;
        } else {
          notification_body =
            qInstance.questionnaire.notification_body_in_progress;
        }
        await postgresqlHelper.deleteScheduledNotification(notification_id);
        return {
          notification_type: resultNotificationByID.notification_type,
          reference_id: resultNotificationByID.reference_id,
          title: qInstance.questionnaire.notification_title,
          body: notification_body,
          questionnaire_id: qInstance.questionnaire_id,
          questionnaire_version: qInstance.questionnaire_version,
        };
      }
      case 'sample': {
        await postgresqlHelper.deleteScheduledNotification(notification_id);
        return {
          notification_type: resultNotificationByID.notification_type,
          reference_id: resultNotificationByID.reference_id,
          title: 'Neuer Laborbericht!',
          body: 'Eine Ihrer Proben wurde analysiert, klicken Sie direkt auf diese Nachricht um das Ergebnis zu öffnen.',
        };
      }
      case 'custom': {
        await postgresqlHelper.deleteScheduledNotification(notification_id);
        return {
          notification_type: resultNotificationByID.notification_type,
          reference_id: resultNotificationByID.reference_id,
          title: resultNotificationByID.title,
          body: resultNotificationByID.body,
        };
      }
      default:
        throw Boom.notFound('Got notification of unknown type');
    }
  }

  private static async processNotificationForRecipient(
    recipient: string,
    notification: Notification,
    failedSendTo: string[],
    notLoggedIn: string[],
    notificationDate: Date,
    allowedStudies: string[]
  ): Promise<void> {
    let tokens: FcmToken[] = [];
    try {
      tokens = (await postgresqlHelper.getToken(recipient)) as FcmToken[];
    } catch {
      failedSendTo.push(recipient);
      return;
    }

    if (tokens.length === 0) {
      // we have no token to send the notification to
      // decide whether the recipient is missing or if we want to schedule the notification for later sending
      if (!failedSendTo.includes(recipient)) {
        if (!(await UserserviceClient.isUserExistentByUsername(recipient))) {
          failedSendTo.push(recipient);
          return;
        }

        // schedule a notification for later
        notLoggedIn.push(recipient);
        await NotificationHelper.createCustomNotification(
          notificationDate,
          recipient,
          '',
          notification.title,
          notification.body
        );
      }
      return;
    }

    // check that the proband manager has access to that study
    tokens = tokens.filter((token) => {
      return allowedStudies.includes(token.study);
    });

    if (tokens.length === 0) {
      if (!failedSendTo.includes(recipient)) {
        failedSendTo.push(recipient);
      }
      return;
    }

    if (!notification.date) {
      // send the notification now
      await NotificationInteractor.sendNotification(
        recipient,
        tokens,
        notification
      );
    } else {
      // send the notification later
      await NotificationHelper.createCustomNotification(
        notificationDate,
        recipient,
        '',
        notification.title,
        notification.body
      );
    }
  }

  private static async sendNotification(
    recipient: string,
    tokens: FcmToken[],
    notification: Notification
  ): Promise<void> {
    const customNotificationObj =
      await NotificationHelper.createCustomNotification(
        null,
        recipient,
        '',
        notification.title,
        notification.body
      );

    assert(customNotificationObj.id);

    await NotificationHelper.sendNotifications({
      recipient,
      tokens,
      notificationId: customNotificationObj.id,
      type: 'custom',
    });
  }
}
