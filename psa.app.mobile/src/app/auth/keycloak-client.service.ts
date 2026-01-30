/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable, signal, Signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';
// we cannot use the capacitor browser plugin because it is not invoked for subsequent page loads
// see https://capacitorjs.com/docs/apis/browser#addlistenerbrowserpageloaded-, https://github.com/ionic-team/capacitor/issues/1291, https://github.com/ionic-team/capacitor/issues/761
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { LoginFailedError } from './errors/login-failed-error';
import { TranslateService } from '@ngx-translate/core';
import { PiaKeycloakAdapter } from './keycloak-adapter/keycloak-adapter';
import { Platform } from '@ionic/angular/standalone';
import Keycloak from 'keycloak-js';
import { createKeycloakSignal, KeycloakEvent } from 'keycloak-angular';
import { KeycloakFactoryService } from './keycloak.factory';
import { BehaviorSubject } from 'rxjs';
import { CurrentUser } from './current-user.service';

@Injectable({
  providedIn: 'root',
})
export class KeycloakClientService {
  public keycloak: Keycloak | undefined;
  public readonly keycloakReady$ = new BehaviorSubject<boolean>(false);
  public keycloakSignal: Signal<KeycloakEvent> | undefined;
  public readonly keycloakIsInitialized = signal(false);

  constructor(
    private readonly http: HttpClient,
    private readonly endpoint: EndpointService,
    private readonly inAppBrowser: InAppBrowser,
    private readonly translate: TranslateService,
    private readonly platform: Platform,
    private readonly keycloakFactory: KeycloakFactoryService,
    private readonly currentUser: CurrentUser
  ) {}

  public async initialize(): Promise<void> {
    if (this.keycloakIsInitialized()) {
      return;
    }

    if (this.platform.is('hybrid')) {
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
    } else {
      const url = environment.authServer.url;
      if (!url) {
        throw new Error('Keycloak URL is not defined in the environment');
      }
      this.keycloak = this.keycloakFactory.create({
        ...environment.authServer,
        url,
      });
      this.keycloakSignal = createKeycloakSignal(this.keycloak);
      await this.keycloak.init({
        pkceMethod: 'S256',
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',
      });
    }

    this.keycloakIsInitialized.set(true);
  }

  public isLoggedIn(): boolean {
    return this.keycloakIsInitialized() && this.keycloak.authenticated;
  }

  public async login({
    hidden,
    username = '',
    locale = null,
    redirectUri,
  }: {
    hidden: boolean;
    username?: string;
    locale?: string;
    redirectUri?: string;
  }): Promise<void> {
    if (!this.keycloakIsInitialized()) {
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
        redirectUri,
      });
      if (this.keycloak.token) {
        this.currentUser.init(this.keycloak.token);
      }
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
    console.log('logging out');

    if (!this.keycloakIsInitialized()) {
      console.log('initializing keycloak again');
      await this.initialize();
    }

    await this.keycloak.logout({
      redirectUri: this.keycloak.createLogoutUrl(),
    });

    this.endpoint.removeLatestEndpoint();
    this.currentUser.reset();
  }

  public createRegisterUrl(study: string): string {
    if (!this.keycloak) {
      throw new Error('Keycloak is not initialized');
    }
    const url = new URL(
      this.keycloak.createRegisterUrl({
        redirectUri: environment.baseUrl,
      })
    );

    url.searchParams.set('study', study);
    return url.toString();
  }
}
