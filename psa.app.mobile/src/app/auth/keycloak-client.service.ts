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
import { firstValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs/internal/observable/of';
import {
  InAppBrowser,
  InAppBrowserEvent,
  InAppBrowserObject,
  InAppBrowserOptions,
} from '@awesome-cordova-plugins/in-app-browser/ngx';
import { AuthService } from './auth.service';
import { LoginFailedError } from './errors/login-failed-error';
import { NoErrorToastHeader } from '../shared/interceptors/http-error-interceptor.service';
import { TranslateService } from '@ngx-translate/core';

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
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  public async initialize() {
    if (!this._hasBeenInitialized) {
      await this.keycloakService.init({
        config: {
          ...environment.authServer,
          url: this.getApiUrl(),
        },
        initOptions: {
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

      this.authService.onBeforeLogout(() => this.logout());

      this.keycloakService.keycloakEvents$.subscribe(async (e) => {
        if (e.type === KeycloakEventType.OnTokenExpired) {
          await this.keycloakService.updateToken();
        }

        if (e.type === KeycloakEventType.OnAuthRefreshError) {
          await this.authService.logout();
        }

        if (e.type === KeycloakEventType.OnAuthRefreshSuccess) {
          this.authService.handleKeycloakToken(
            await this.keycloakService.getToken()
          );
        }
      });

      this._hasBeenInitialized = true;
    }
  }

  public async isCompatible(): Promise<boolean> {
    return firstValueFrom(
      this.http
        .get(this.getApiUrl() + 'realms/' + environment.authServer.realm, {
          observe: 'response',
          headers: {
            [NoErrorToastHeader]: '',
          },
        })
        .pipe(
          map((res) => res.status === 200),
          catchError(() => of(false))
        )
    );
  }

  public async login(username: string, locale: string): Promise<void> {
    try {
      await this.initialize();
      await this.keycloakService.login({
        loginHint: username,
        locale,
        cordovaOptions: this.getInAppBrowserToolbarOptions(),
      });

      const token = await this.keycloakService.getToken();
      this.authService.handleKeycloakToken(token);
    } catch (e) {
      if (e === undefined) {
        throw new LoginFailedError();
      }

      throw e;
    }
  }

  public async openAccountManagement(): Promise<void> {
    // We cannot style the toolbar by using keycloak.js to open account management.
    // The logic and configuration is similar the original keycloak.js implementation.
    const accountUrl = this.keycloakService
      .getKeycloakInstance()
      .createAccountUrl();

    const browser = await this.getInAppBrowser(accountUrl, {
      location: 'no',
      ...this.getInAppBrowserToolbarOptions(),
    });

    browser.on('loadstart').subscribe(this.getLoadStartCallback(browser));
    browser.show();
  }

  public async logout(): Promise<void> {
    await this.initialize();
    // Because of an inappbrowser bug, the keycloak adapters logout method is not working.
    // We wrote our own logic to open/close the inappbrowser.
    // @see https://github.com/apache/cordova-plugin-inappbrowser/issues/649
    // return this.keycloakService.logout();

    const browser = await this.getLogoutInAppBrowser();

    const promise = new Promise<void>((resolve, reject) => {
      browser.on('loadstart').subscribe(this.getLoadStartCallback(browser));
      browser.on('loaderror').subscribe((event) => {
        // Doing live reload on an existing login can result in an empty event url
        if (event.url === '' || event.url.indexOf('http://localhost') === 0) {
          this.keycloakService.clearToken();
          browser.close();
          resolve();
        } else {
          browser.close();
          reject();
        }
      });
    });

    browser.hide();

    return promise;
  }

  private getApiUrl() {
    return this.endpoint.getUrl() + '/api/v1/auth/';
  }

  private getLogoutInAppBrowser(): Promise<InAppBrowserObject> {
    let logoutUrl = this.keycloakService
      .getKeycloakInstance()
      .createLogoutUrl();

    return this.getInAppBrowser(logoutUrl, {
      location: 'no',
      hidden: 'yes',
      ...this.getInAppBrowserToolbarOptions(),
    });
  }

  private getInAppBrowser(
    url: string,
    options?: InAppBrowserOptions
  ): Promise<InAppBrowserObject> {
    return new Promise<InAppBrowserObject>((resolve) => {
      document.addEventListener(
        'deviceready',
        () => {
          const browser = this.inAppBrowser.create(url, '_blank', options);
          resolve(browser);
        },
        false
      );
    });
  }

  private getLoadStartCallback(
    browser: InAppBrowserObject
  ): (event: InAppBrowserEvent) => void {
    return (event) => {
      if (event.url.indexOf('http://localhost') === 0) {
        browser.close();
      }
    };
  }

  private getInAppBrowserToolbarOptions(): Record<string, string> {
    return {
      closebuttoncaption: this.translate.instant('GENERAL.GO_BACK'),
      closebuttoncolor: '#ffffff',
      toolbarcolor: '#599118',
      hidenavigationbuttons: 'yes',
      toolbarposition: 'top',
    };
  }
}
