/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AuthCredentials } from '@hapi/hapi';

/**
 * Used to access the application APIs
 */
export interface AccessToken extends AuthCredentials {
  username: string;
  studies: string[];
  locale: string;
}

export function isAccessToken(
  token: Record<string, unknown>
): token is AccessToken {
  return (
    !!token['username'] && !!token['locale'] && Array.isArray(token['studies'])
  );
}
