/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as fbAdmin from 'firebase-admin';
import { FirebaseError } from 'firebase-admin';
import { MarkRequired } from 'ts-essentials';

import { config } from '../config';

export class FcmHelper {
  /**
   * @description initializes the firebase-admin adk with the fb projects and acc
   */
  public static initFBAdmin(this: void): void {
    const credential = config.fireBaseCredentials;
    fbAdmin.initializeApp({
      credential: fbAdmin.credential.cert(credential),
      projectId: credential.projectId,
    });
  }

  /**
   * @description sends a default fcm message to one user
   * @param {string} fcmToken the token of the user to send the message to
   * @param {object} notification_id the notification id to send
   */
  public static async sendDefaultNotification(
    this: void,
    fcmToken: string,
    notificationId: number,
    badgeNumber?: number
  ): Promise<
    Partial<fbAdmin.messaging.MessagingDevicesResponse> & {
      error?: FirebaseError;
      exception: unknown;
    }
  > {
    const title = 'PIA - Sie haben eine neue Nachricht.';
    const body = 'Bitte tippen Sie auf diese Meldung, um Sie anzuzeigen.';

    const payload: MarkRequired<
      fbAdmin.messaging.MessagingPayload,
      'notification'
    > = {
      notification: {
        title,
        body,
      },
      data: {
        id: notificationId.toString(),
        title,
        body,
        notification_foreground: 'true',
      },
    };

    if (typeof badgeNumber === 'number') {
      payload.notification.badge = badgeNumber.toString();
    }

    try {
      const result = await fbAdmin.messaging().sendToDevice(fcmToken, payload);

      if (result.failureCount > 0) {
        return { error: result.results[0]?.error, exception: undefined };
      } else {
        return { ...result, error: undefined, exception: undefined };
      }
    } catch (exception) {
      return { exception: exception, error: undefined };
    }
  }
}
