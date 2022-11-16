/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { KeycloakService } from 'keycloak-angular';
import { environment } from '../environments/environment';
import { CurrentUser } from './_services/current-user.service';

export function initializeAuthentication(
  keycloak: KeycloakService,
  currentUser: CurrentUser
): () => Promise<boolean> {
  return async () => {
    try {
      const result = await keycloak.init({
        config: environment.authserver,
        initOptions: {
          pkceMethod: 'S256',
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri:
            environment.baseUrl + '/assets/silent-check-sso.html',
        },
      });
      await currentUser.init(keycloak);
      return result;
    } catch (e) {
      await keycloak.logout();
      return false;
    }
  };
}
