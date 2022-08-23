/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Platform } from '@ionic/angular';
import { AuthService } from './auth/auth.service';
import { KeycloakClientService } from './auth/keycloak-client.service';
import { EndpointService } from './shared/services/endpoint/endpoint.service';
import { LocaleService } from './shared/services/locale/locale.service';

/**
 * This will initialize authentication and set the correct endpoint
 * if the user has an active keycloak session.
 */
export function initializeActiveSession(
  platform: Platform,
  auth: AuthService,
  keycloakClient: KeycloakClientService,
  endpoint: EndpointService,
  localeService: LocaleService
): () => Promise<void> {
  return async () => {
    await platform.ready();

    const currentUser = auth.getCurrentUser();
    if (currentUser !== null) {
      endpoint.setEndpointForUser(currentUser.username);

      if (await keycloakClient.isCompatible()) {
        try {
          await keycloakClient.login(
            currentUser.username,
            localeService.currentLocale,
            false // TODO: hide login window as soon as we know, that user is logged in
          );
        } catch (e) {
          console.error('Authentication initialization failed with: ', e);
        }
      }
    }
  };
}
