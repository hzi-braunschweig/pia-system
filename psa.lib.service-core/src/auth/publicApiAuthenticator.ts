/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi from '@hapi/hapi';
import { AuthClientSettings } from '../config/configModel';
import { TsoaAuthenticator } from './tsoaAuthenticator';
import { AccessToken } from './authModel';

export const publicApiSecurity = 'jwt-public';

export class PublicApiAuthenticator extends TsoaAuthenticator {
  private static readonly publicApiSecurityName = publicApiSecurity;

  public static async authenticate(
    securityName: string,
    request: Hapi.Request,
    authClientSettings: AuthClientSettings
  ): Promise<AccessToken> {
    return await new this(
      this.publicApiSecurityName,
      authClientSettings
    ).authenticate(securityName, request);
  }
}
