/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RealmRole } from '../auth/realmRole';

export interface TokenAttributes {
  username: string;
  roles: RealmRole[];
  studies: string[];
}

export interface AuthHeader {
  authorization: string;
}

/**
 * Builds auth tokens for testing purposes. Won't work if used with Keycloak.
 */
export class AuthTokenMockBuilder {
  /**
   * Create HTTP Authorization header including a JWT token with given attributes
   */
  public static createAuthHeader(tokenAttributes: TokenAttributes): AuthHeader {
    return { authorization: this.createToken(tokenAttributes) };
  }

  /**
   * Create JWT token with given attributes
   */
  public static createToken(tokenAttributes: TokenAttributes): string {
    return this.buildToken(this.createTokenPayload(tokenAttributes));
  }

  /**
   * Create token payload with given username, role and studies
   *
   * The token also returns default properties of a token issued
   * by Keycloak. Nevertheless, some properties are missing for
   * simplicity.
   */
  public static createTokenPayload({
    username,
    roles,
    studies,
  }: TokenAttributes): Record<string, unknown> {
    this.assertLowerCase(username);
    return {
      exp: 1700000000,
      iat: 1700000000,
      auth_time: 1700000000,
      iss: 'http://localhost/api/v1/auth/realms/pia-realm',
      aud: 'account',
      typ: 'Bearer',
      azp: 'pia-web-app-client',
      preferred_username: username,
      email_verified: false,
      'allowed-origins': ['http://localhost'],
      realm_access: {
        roles,
      },
      resource_access: {
        account: {
          roles: ['manage-account', 'manage-account-links', 'view-profile'],
        },
      },
      scope: 'openid profile email',
      studies: studies,
      client_id: 'pia-web-app-client',
      username: username,
      locale: 'de-DE',
      active: true,
    };
  }

  /**
   * Build JWT bearer token
   */
  private static buildToken(tokenPayload: Record<string, unknown>): string {
    return (
      'Bearer ' +
      this.toBase64(JSON.stringify({ alg: 'RS512', typ: 'JWT' })) +
      '.' +
      this.toBase64(JSON.stringify(tokenPayload)) +
      '.' +
      this.toBase64('signature')
    );
  }

  /**
   * Create base64 string from UTF8 string without padding
   */
  private static toBase64(value: string): string {
    return Buffer.from(value).toString('base64').replace(/=/g, '');
  }

  private static assertLowerCase(value: string): void {
    if (value !== value.toLowerCase()) {
      throw new Error(
        `tokens cannot contain usernames in upper case: "${value}"`
      );
    }
  }
}
