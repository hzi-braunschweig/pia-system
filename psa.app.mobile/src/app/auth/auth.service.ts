/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Inject, Injectable } from '@angular/core';
import { KeycloakClientService } from './keycloak-client.service';
import { DOCUMENT } from '@angular/common';
import { BadgeService } from '../shared/services/badge/badge.service';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly keycloakClient: KeycloakClientService,
    private readonly badgeService: BadgeService,
    private readonly platform: Platform
  ) {}

  public isAuthenticated(): boolean {
    return this.keycloakClient.isLoggedIn();
  }

  public async loginWithUsername(
    username: string,
    locale: string
  ): Promise<void> {
    await this.keycloakClient.initialize();
    await this.keycloakClient.login({ hidden: false, username, locale });
  }

  public async activateExistingSession(): Promise<void> {
    await this.keycloakClient.initialize();
    if (this.platform.is('hybrid')) {
      await this.keycloakClient.login({ hidden: true });
    }
  }

  public async openAccountManagement(): Promise<void> {
    return await this.keycloakClient.openAccountManagement();
  }

  public async logout(): Promise<void> {
    await this.keycloakClient.logout();
    this.badgeService.clear();

    if (this.platform.is('hybrid')) {
      this.reloadApp();
    }
  }

  /**
   * Executes a full page reload in order to clear any cached views.
   *
   * Please keep in mind that any running async task is going to stop
   * immediately.
   */
  private reloadApp() {
    this.document.defaultView.location.href = '/';
  }
}
