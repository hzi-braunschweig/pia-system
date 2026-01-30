/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { KeycloakConfig } from 'keycloak-js';

export interface Environment {
  production?: boolean;
  baseUrl: string;
  locale: string;
  androidAppId: string;
  iOSAppId: string;
  authServer: KeycloakConfig;
}
