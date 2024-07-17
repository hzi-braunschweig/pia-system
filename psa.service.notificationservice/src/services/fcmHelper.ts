/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fbAdmin, { FirebaseError } from 'firebase-admin';
import { TokenMessage } from 'firebase-admin/lib/messaging/messaging-api';
import { config } from '../config';
import {
  FirebaseMessageRejectedError,
  FirebaseMessageUnknownError,
} from '../errors';

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
   * @param fcmToken the token of the user to send the message to
   * @param notificationId the notification id to send
   * @param badgeNumber the number to show as badge
   * @returns the fcm id of the message sent
   */
  public static async sendDefaultNotification(
    this: void,
    fcmToken: string,
    notificationId: number,
    badgeNumber?: number
  ): Promise<string> {
    const title = 'PIA - Sie haben eine neue Nachricht.';
    const body = 'Bitte tippen Sie auf diese Meldung, um Sie anzuzeigen.';
    const message: TokenMessage = {
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
      token: fcmToken,
    };

    if (typeof badgeNumber === 'number') {
      message.apns = {
        payload: {
          aps: {
            badge: badgeNumber,
          },
        },
      };
      message.android = {
        notification: {
          notificationCount: badgeNumber,
        },
      };
    }

    try {
      return await FcmHelper.getFirebaseMessaging().send(message);
    } catch (error: unknown) {
      if (FcmHelper.isFirebaseError(error)) {
        if (error.code == 'messaging/registration-token-not-registered') {
          throw new FirebaseMessageRejectedError(error);
        }
        throw new FirebaseMessageUnknownError(error);
      }

      throw error;
    }
  }

  public static getFirebaseMessaging(): fbAdmin.messaging.Messaging {
    return fbAdmin.messaging();
  }

  private static isFirebaseError(error: unknown): error is FirebaseError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as Partial<FirebaseError>).code !== undefined
    );
  }
}
