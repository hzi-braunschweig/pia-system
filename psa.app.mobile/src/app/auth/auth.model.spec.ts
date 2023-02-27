/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { User } from './auth.model';
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
      roles: ['Proband'],
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
