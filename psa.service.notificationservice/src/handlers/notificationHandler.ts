/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { Request } from '@hapi/hapi';

import { NotificationInteractor } from '../interactors/notificationInteractor';

import { Notification } from '../models/notification';

/**
 * @description HAPI Handler for fcm notifications
 */
export class NotificationHandler {
  /**
   * @function
   * @description post the fcm notification
   */
  public static async postOne(
    this: void,
    request: Request
  ): Promise<{ success: boolean }> {
    try {
      return await NotificationInteractor.createNotification(
        request.auth.credentials,
        request.payload as Notification
      );
    } catch (err) {
      console.log('Could not send fcm notification:', err);
      if (err instanceof Boom.Boom) {
        throw err;
      }
      throw Boom.internal((err as Error).message);
    }
  }

  /**
   * @function
   * @description get the notification
   */
  public static async getOne(this: void, request: Request): Promise<unknown> {
    return NotificationInteractor.getNotification(
      request.auth.credentials,
      request.params['id'] as number
    );
  }
}
