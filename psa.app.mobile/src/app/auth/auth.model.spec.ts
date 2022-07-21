/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { AccessToken, LoginResponse, User } from './auth.model';
import { KeycloakTokenParsed } from 'keycloak-js';

export function createKeycloakToken(
  user?: Partial<User>,
  removeProperties: string[] = []
): {
  token: string;
  payload: KeycloakTokenParsed;
} {
  const header = { alg: 'RS512', typ: 'JWT' };
  const payload: KeycloakTokenParsed = {
    exp: Date.now() + 60000,
    iat: Date.now(),
    auth_time: Date.now(),
    realm_access: {
      roles: [user?.role ?? 'Proband'],
    },
    studies: [user?.study ?? 'Dummy Study'],
    locale: 'de-DE',
    username: user?.username ?? 'fake-username',
  };

  for (const property of removeProperties) {
    delete payload[property];
  }

  const token: string =
    btoa(JSON.stringify(header)) +
    '.' +
    btoa(JSON.stringify(payload)) +
    '.' +
    btoa('signature');

  return {
    token,
    payload,
  };
}

export function createLegacyToken(tokenPayload: Partial<AccessToken> = {}) {
  return (
    btoa(JSON.stringify({ alg: 'RS512', typ: 'JWT' })) +
    '.' +
    btoa(
      JSON.stringify({
        id: 1,
        role: tokenPayload.role ?? 'Proband',
        username: tokenPayload.username ?? '',
        groups: tokenPayload.groups ?? ['test study'],
        locale: 'de-DE',
        app: 'web',
        iat: Date.now(),
        exp: Date.now() + 60000,
      })
    ) +
    '.' +
    btoa('signature')
  );
}

export function createLegacyLoginResponse(
  tokenPayload: Partial<AccessToken> = {},
  overwrite: Partial<LoginResponse> = {}
): LoginResponse {
  return {
    pw_change_needed: false,
    token_login:
      btoa(JSON.stringify({ alg: 'RS512', typ: 'JWT' })) +
      '.' +
      btoa(
        JSON.stringify({
          id: 2,
          username: tokenPayload.username ?? '',
          iat: Date.now(),
          exp: Date.now() + 60000,
        })
      ) +
      '.' +
      btoa('signature'),
    token: createLegacyToken(tokenPayload),
    ...overwrite,
  };
}
