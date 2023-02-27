/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Platform } from '@ionic/angular';
import { EndpointService } from './shared/services/endpoint/endpoint.service';
import { AuthService } from './auth/auth.service';

/**
 * This will initialize authentication if the user has an active keycloak session.
 */
export function initializeExistingSession(
  platform: Platform,
  endpoint: EndpointService,
  auth: AuthService
): () => Promise<void> {
  return async () => {
    // we cannot have an existing session, if we do not know the endpoint
    if (!endpoint.getUrl()) {
      return;
    }

    try {
      await auth.activateExistingSession();
    } catch (err) {
      // just skip if an error occurs, user will be sent to login page anyway
      console.error('Initialization of existing session failed:', err);
    }
  };
}
