/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi from '@hapi/hapi';
import { StatusCodes } from 'http-status-codes';
import { decode } from 'jsonwebtoken';
import fetch from 'node-fetch';
import { AuthClientSettings } from '../config/configModel';
import { MissingStudyAccessError } from './assertStudyAccess';
import { SpecificError } from '../plugins/errorHandler';
import { AccessToken } from './authModel';

interface TokenIntrospectionResult {
  active: boolean;
}

class InvalidAuthorizationTokenError extends SpecificError {
  public readonly statusCode = StatusCodes.UNAUTHORIZED;
  public readonly errorCode = 'INVALID_AUTHORIZATION_TOKEN';
  public readonly message = 'No or invalid authorization token provided';
}

export abstract class TsoaAuthenticator {
  protected constructor(
    private readonly securityName: string,
    private readonly authClientSettings: AuthClientSettings
  ) {}

  public async authenticate(
    securityNameOfPath: string,
    request: Hapi.Request
  ): Promise<AccessToken> {
    if (securityNameOfPath !== this.securityName) {
      throw new Error('Unknown security configuration');
    }

    const authToken = (request.headers['Authorization'] ||
      request.headers['authorization']) as string;

    if (!authToken) {
      throw new InvalidAuthorizationTokenError();
    }

    const decodedToken = await this.verifyToken(
      authToken.replace('Bearer', '').trim()
    );

    this.assertStudyAccess(request, decodedToken);

    return decodedToken;
  }

  private async verifyToken(authToken: string): Promise<AccessToken> {
    const decodedToken = decode(authToken, {
      json: true,
    }) as AccessToken | null;

    if (decodedToken === null || !(await this.isTokenValid(authToken))) {
      throw new InvalidAuthorizationTokenError();
    }

    return decodedToken;
  }

  private async isTokenValid(authToken: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${this.authClientSettings.connection.url}/realms/${this.authClientSettings.realm}/protocol/openid-connect/token/introspect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `client_id=${encodeURIComponent(
            this.authClientSettings.clientId
          )}&client_secret=${encodeURIComponent(
            this.authClientSettings.secret
          )}&token=${encodeURIComponent(authToken)}`,
        }
      );

      return ((await res.json()) as TokenIntrospectionResult).active;
    } catch (e) {
      return false;
    }
  }

  private assertStudyAccess(
    request: Hapi.Request,
    decodedToken: { studies: string[] }
  ): void {
    const expectedStudyName = request.params['studyName'] as string;

    if (!expectedStudyName) {
      return;
    }

    if (!decodedToken.studies.includes(expectedStudyName)) {
      throw new MissingStudyAccessError(
        `Requesting user has no access to study "${expectedStudyName}"`
      );
    }
  }
}
