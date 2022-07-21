/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { AccessToken, getProbandStudy } from '@pia/lib-service-core';
import postgresqlHelper from '../services/postgresqlHelper';

/**
 * @description interactor that handles fcmToken requests based on users permissions
 */
export class FcmTokenInteractor {
  /*
   * @description checks the token and creates a new fcm token for user
   */
  public static async createFCMToken(
    accessToken: AccessToken,
    fcmToken: string
  ): Promise<{ fcm_token: string }> {
    const study = getProbandStudy(accessToken);
    await postgresqlHelper.updateFCMToken(
      fcmToken,
      accessToken.username,
      study
    );
    return { fcm_token: fcmToken };
  }
}
