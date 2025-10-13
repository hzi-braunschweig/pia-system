/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  createInterceptorCondition,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  IncludeBearerTokenCondition,
  provideKeycloak,
} from 'keycloak-angular';
import { environment } from '../environments/environment';

const baseUrlCondition =
  createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: /.*/,
  });

export function provideKeycloakAngular() {
  return provideKeycloak({
    config: environment.authserver,
    initOptions: {
      pkceMethod: 'S256',
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri:
        environment.baseUrl + '/assets/silent-check-sso.html',
    },
    providers: [
      {
        provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
        useValue: [baseUrlCondition],
      },
    ],
  });
}
