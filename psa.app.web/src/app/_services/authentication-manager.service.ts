/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { FCMService } from './fcm.service';

@Injectable()
export class AuthenticationManager {
  constructor(
    private keycloak: KeycloakService,
    private fcmService: FCMService
  ) {}

  public async logout(): Promise<void> {
    await this.fcmService.onLogout();
    return this.keycloak.logout();
  }
}
