/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { inject, Injectable } from '@angular/core';
import { FCMService } from './fcm.service';
import Keycloak from 'keycloak-js';

@Injectable()
export class AuthenticationManager {
  private readonly keycloak = inject(Keycloak);
  constructor(private readonly fcmService: FCMService) {}

  public async logout(): Promise<void> {
    await this.fcmService.onLogout();
    return this.keycloak.logout();
  }
}
