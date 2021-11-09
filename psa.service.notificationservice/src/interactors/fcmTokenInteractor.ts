/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import * as Boom from '@hapi/boom';
import { AccessToken } from '@pia/lib-service-core';
import postgresqlHelper from '../services/postgresqlHelper';

/**
 * @description interactor that handles fcmToken requests based on users permissions
 */
export class FcmTokenInteractor {
  /*
   * @description checks the token and creates a new fcm token for user
   */
  public static async createFCMToken(
    accessToken: Partial<AccessToken>,
    fcmToken: string
  ): Promise<{ fcm_token: string }> {
    if (accessToken.role !== 'Proband') {
      throw Boom.forbidden('only probands are allowed to create a fcm token');
    }
    const studies = accessToken.groups;
    if (!studies || studies.length !== 1) {
      throw Boom.badRequest('authToken.groups must contain exactly one study');
    }
    const study = studies[0];
    await postgresqlHelper.updateFCMToken(
      fcmToken,
      accessToken.username,
      study
    );
    return { fcm_token: fcmToken };
  }
}

export default FcmTokenInteractor;
