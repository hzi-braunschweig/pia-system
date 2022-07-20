/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { Request } from '@hapi/hapi';
import { AccessToken } from '@pia/lib-service-core';

import { FcmTokenInteractor } from '../interactors/fcmTokenInteractor';

/**
 * @description HAPI Handler for fcm tokens
 */
export class FcmTokenHandler {
  /**
   * @function
   * @description post the fcm token for the user
   * @memberof module:fcmTokenHandler
   */
  public static async postOne(
    this: void,
    request: Request
  ): Promise<{ fcm_token: string }> {
    try {
      return await FcmTokenInteractor.createFCMToken(
        request.auth.credentials as AccessToken,
        (request.payload as { fcm_token: string }).fcm_token
      );
    } catch (err) {
      console.log('Could not create fcm token:', err);
      if (err instanceof Boom.Boom) {
        throw err;
      }
      throw Boom.internal((err as Error).message);
    }
  }
}
