/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { AccessToken, LoginResponse } from './auth.model';

export function createToken(tokenPayload: Partial<AccessToken> = {}) {
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

export function createLoginResponse(
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
    token: createToken(tokenPayload),
    ...overwrite,
  };
}
