/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as Crypto from 'crypto';
import * as Boom from '@hapi/boom';
import { TokenService } from '../services/tokenService';
import { config } from '../config';

const tokenLength = 32;

export class TokenInteractor {
  /**
   * @function
   * @description Generates and retrieves the token
   */
  public static async requestToken(
    username: string,
    password: string
  ): Promise<string | undefined> {
    if (
      username !== config.sormasOnPia.username ||
      password !== config.sormasOnPia.password
    ) {
      return;
    }

    try {
      await TokenService.deleteOutdated();
    } catch (exc) {
      console.log('failed to delete outdated token', exc);
    }

    try {
      const token = Crypto.randomBytes(tokenLength).toString('hex');
      await TokenService.storeToken(token);
      return token;
    } catch (exc) {
      throw Boom.internal('Token could not be stored internally');
    }
  }
}
