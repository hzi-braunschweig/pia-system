/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { effect, Injectable, signal, Signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';
// we cannot use the capacitor browser plugin because it is not invoked for subsequent page loads
// see https://capacitorjs.com/docs/apis/browser#addlistenerbrowserpageloaded-, https://github.com/ionic-team/capacitor/issues/1291, https://github.com/ionic-team/capacitor/issues/761
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { LoginFailedError } from './errors/login-failed-error';
import { TranslateService } from '@ngx-translate/core';
import { CurrentUser } from './current-user.service';
import { PiaKeycloakAdapter } from './keycloak-adapter/keycloak-adapter';
import { Platform } from '@ionic/angular';
import Keycloak from 'keycloak-js';
import {
  createKeycloakSignal,
  KeycloakEvent,
  KeycloakEventType,
} from 'keycloak-angular';
import { KeycloakFactoryService } from './keycloak.factory';

@Injectable({
  providedIn: 'root',
})
export class KeycloakClientService {
  private _hasBeenInitialized = false;
  public keycloak: Keycloak | undefined;
  private keycloakSignal: Signal<KeycloakEvent> | undefined;
  private readonly keycloakReady = signal(false);

  get hasBeenInitialized(): boolean {
    return this._hasBeenInitialized;
  }

  constructor(
    private readonly http: HttpClient,
    private readonly endpoint: EndpointService,
    private readonly inAppBrowser: InAppBrowser,
    private readonly translate: TranslateService,
    private readonly platform: Platform,
    private readonly currentUser: CurrentUser,
    private readonly keycloakFactory: KeycloakFactoryService
  ) {
    effect(async () => {
      console.log('KeycloakClientService effect triggered');
      if (!this.keycloakReady()) {
        return;
      }
      const keycloakEvent = this.keycloakSignal();
      console.log(
        'received keycloak event:',
        KeycloakEventType[keycloakEvent.type]
      );
      if (keycloakEvent.type === KeycloakEventType.TokenExpired) {
        console.warn('Token expired, refreshing token');
        try {
          await this.keycloak.updateToken(30);
        } catch (error) {
          console.error('Failed to refresh token:', error);
          await this.logout();
        }
      }
      if (keycloakEvent.type === KeycloakEventType.AuthRefreshError) {
        console.warn('Auth refresh error, logging out');
        await this.logout();
      }
      if (keycloakEvent.type === KeycloakEventType.AuthRefreshSuccess) {
        const token = this.keycloak.token;
        if (token) {
          this.currentUser.init(token);
        } else {
          console.error(
            'Keycloak Token is undefined after KeycloakEventType.AuthRefreshSuccess'
          );
        }
      }
    });
  }

  public async initialize(): Promise<void> {
    if (this._hasBeenInitialized) {
      return;
    }

    await this.platform.ready();

    const apiUrl = this.endpoint.getUrl() + '/api/v1/auth/';
    this.keycloak = this.keycloakFactory.create({
      ...environment.authServer,
      url: apiUrl,
    });
    this.keycloakSignal = createKeycloakSignal(this.keycloak);
    await this.keycloak.init({
      adapter: new PiaKeycloakAdapter(
        this.keycloak,
        this.inAppBrowser,
        this.translate,
        this.http,
        apiUrl + 'realms/' + environment.authServer.realm
      ),
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });

    this._hasBeenInitialized = true;
    this.keycloakReady.set(true);
  }

  public isLoggedIn(): boolean {
    return this._hasBeenInitialized && this.keycloak.authenticated;
  }

  public async login(
    hidden: boolean,
    username: string = '',
    locale: string = null
  ): Promise<void> {
    if (!this._hasBeenInitialized) {
      throw new LoginFailedError(
        'KeycloakClientService has not been initialized'
      );
    }

    try {
      await this.keycloak.login({
        loginHint: username,
        locale,
        cordovaOptions: {
          ...(hidden ? { hidden: 'yes' } : {}),
        },
      });

      const token = this.keycloak.token;
      if (!token) {
        console.error('Keycloak token is undefined');
        throw new LoginFailedError('Keycloak token is undefined');
      }
      this.currentUser.init(token);
    } catch (e) {
      console.error('Error at logging in to keycloak');
      if (e === undefined) {
        throw new LoginFailedError();
      }

      throw e;
    }
  }

  public async openAccountManagement(): Promise<void> {
    await this.keycloak.accountManagement();
  }

  public async logout(): Promise<void> {
    if (!this._hasBeenInitialized) {
      await this.initialize();
    }

    await this.keycloak.logout();

    this.endpoint.removeLatestEndpoint();
  }
}
