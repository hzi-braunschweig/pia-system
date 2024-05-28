/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { KeycloakEventType, KeycloakService } from 'keycloak-angular';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { LoginFailedError } from './errors/login-failed-error';
import { TranslateService } from '@ngx-translate/core';
import { CurrentUser } from './current-user.service';
import { PiaKeycloakAdapter } from './keycloak-adapter/keycloak-adapter';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class KeycloakClientService {
  private _hasBeenInitialized = false;

  get hasBeenInitialized(): boolean {
    return this._hasBeenInitialized;
  }

  constructor(
    private keycloakService: KeycloakService,
    private http: HttpClient,
    private endpoint: EndpointService,
    private inAppBrowser: InAppBrowser,
    private translate: TranslateService,
    private platform: Platform,
    private currentUser: CurrentUser
  ) {}

  public async initialize(): Promise<void> {
    if (this._hasBeenInitialized) {
      return;
    }

    await this.platform.ready();

    const apiUrl = this.endpoint.getUrl() + '/api/v1/auth/';

    this.keycloakService.keycloakEvents$.subscribe(async (e) => {
      console.log('received keycloak event:', KeycloakEventType[e.type]);

      if (e.type === KeycloakEventType.OnTokenExpired) {
        await this.keycloakService.updateToken();
      }

      if (e.type === KeycloakEventType.OnAuthRefreshError) {
        await this.logout();
      }

      if (e.type === KeycloakEventType.OnAuthRefreshSuccess) {
        this.currentUser.init(await this.keycloakService.getToken());
      }
    });

    await this.keycloakService.init({
      config: {
        ...environment.authServer,
        url: apiUrl,
      },
      initOptions: {
        adapter: new PiaKeycloakAdapter(
          this.keycloakService,
          this.inAppBrowser,
          this.translate,
          this.http,
          apiUrl + 'realms/' + environment.authServer.realm
        ),
        pkceMethod: 'S256',
        checkLoginIframe: false,
      },
      shouldAddToken: (request) => {
        const noTokenUrls = [
          this.endpoint.getUrl() + '/api/v1/', // bearer will be rejected by CORS
        ];

        return !noTokenUrls.includes(request.url);
      },
    });

    this._hasBeenInitialized = true;
  }

  public isLoggedIn(): boolean {
    return (
      this._hasBeenInitialized &&
      this.keycloakService.isLoggedIn() &&
      !this.keycloakService.isTokenExpired()
    );
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
      await this.keycloakService.login({
        loginHint: username,
        locale,
        cordovaOptions: {
          ...(hidden ? { hidden: 'yes' } : {}),
        },
      });

      const token = await this.keycloakService.getToken();
      this.currentUser.init(token);
    } catch (e) {
      if (e === undefined) {
        throw new LoginFailedError();
      }

      throw e;
    }
  }

  public async openAccountManagement(): Promise<void> {
    await this.keycloakService.getKeycloakInstance().accountManagement();
  }

  public async logout(): Promise<void> {
    if (!this._hasBeenInitialized) {
      await this.initialize();
    }

    await this.keycloakService.logout();

    this.endpoint.removeLatestEndpoint();
  }
}
