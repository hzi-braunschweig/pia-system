/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { effect, Injectable } from '@angular/core';
// we cannot use the capacitor browser plugin because it is not invoked for subsequent page loads
// see https://capacitorjs.com/docs/apis/browser#addlistenerbrowserpageloaded-, https://github.com/ionic-team/capacitor/issues/1291, https://github.com/ionic-team/capacitor/issues/761
import { CurrentUser } from './current-user.service';
import { Platform } from '@ionic/angular/standalone';
import { KeycloakEventType } from 'keycloak-angular';
import { SideMenuService } from '../shared/services/side-menu/side-menu.service';
import { NotificationService } from '../shared/services/notification/notification.service';
import { KeycloakClientService } from './keycloak-client.service';

@Injectable({
  providedIn: 'root',
})
export class KeycloakEventHandlingService {
  constructor(
    private readonly keycloakClientService: KeycloakClientService,
    private readonly platform: Platform,
    private readonly currentUser: CurrentUser,
    private readonly sideMenu: SideMenuService,
    private readonly notification: NotificationService
  ) {
    effect(async () => {
      console.log('KeycloakClientService effect triggered');
      if (!this.keycloakClientService.keycloakIsInitialized()) {
        return;
      }
      const keycloakEvent = this.keycloakClientService.keycloakSignal();
      console.log(
        'received keycloak event:',
        KeycloakEventType[keycloakEvent.type]
      );

      switch (keycloakEvent.type) {
        case KeycloakEventType.AuthLogout:
          this.notification.onLogout();
          break;

        case KeycloakEventType.Ready:
        case KeycloakEventType.AuthSuccess:
          this.initUser();
          break;

        case KeycloakEventType.TokenExpired:
          console.warn('Token expired, refreshing token');
          try {
            await this.keycloakClientService.keycloak.updateToken(30);
          } catch (error) {
            console.error('Failed to refresh token:', error);
            await this.keycloakClientService.logout();
          }
          break;

        case KeycloakEventType.AuthRefreshError:
          console.warn('Auth refresh error, logging out');
          await this.keycloakClientService.logout();
          break;

        case KeycloakEventType.AuthRefreshSuccess: {
          const token = this.keycloakClientService.keycloak.token;
          if (token) {
            this.currentUser.init(token);
          } else {
            console.error(
              'Keycloak Token is undefined after KeycloakEventType.AuthRefreshSuccess'
            );
          }
          break;
        }
      }
    });
  }

  private async initUser() {
    const authenticated = this.keycloakClientService.keycloak.authenticated;
    const token = this.keycloakClientService.keycloak.token;
    try {
      if (authenticated && token) {
        this.currentUser.init(token);
        await this.sideMenu.setup();
        await this.platform.ready();
        if (this.platform.is('hybrid')) {
          await this.notification.initPushNotifications(
            this.currentUser.username
          );
        }
      } else {
        console.log('Keycloak token is undefined. Resetting user');
        this.currentUser.reset();
      }
    } catch (error) {
      console.error('Error during Keycloak initialization:', error);
    } finally {
      this.keycloakClientService.keycloakReady$.next(true);
    }
  }
}
