/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Inject, Injectable } from '@angular/core';
import { KeycloakClientService } from './keycloak-client.service';
import { DOCUMENT } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { BadgeService } from '../shared/services/badge/badge.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _isAuthenticated: Subject<boolean> = new Subject();

  public readonly isAuthenticated$: Observable<boolean> =
    this._isAuthenticated.asObservable();

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly keycloakClient: KeycloakClientService,
    private readonly badgeService: BadgeService
  ) {}

  public async isAuthenticated(): Promise<boolean> {
    return await this.keycloakClient.isLoggedIn();
  }

  public async loginWithUsername(
    username: string,
    locale: string
  ): Promise<void> {
    await this.keycloakClient.initialize();

    await this.keycloakClient.login(false, username, locale);
    this._isAuthenticated.next(true);
  }

  public async activateExistingSession(): Promise<void> {
    await this.keycloakClient.initialize();

    await this.keycloakClient.login(true);

    this._isAuthenticated.next(true);
  }

  public async openAccountManagement(): Promise<void> {
    return await this.keycloakClient.openAccountManagement();
  }

  public async logout(): Promise<void> {
    this._isAuthenticated.next(false);
    await this.keycloakClient.logout();
    this.badgeService.clear();
    this.reloadApp();
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
