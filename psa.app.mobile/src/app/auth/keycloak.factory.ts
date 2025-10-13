/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';

@Injectable({
  providedIn: 'root',
})
export class KeycloakFactoryService {
  create(config: Keycloak.KeycloakConfig): Keycloak {
    return new Keycloak(config);
  }
}
