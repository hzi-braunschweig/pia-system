/*
 * SPDX-FileCopyrightText: 2004 Red Hat, Inc. and/or its affiliates and other contributors
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Copyright 2016 Red Hat, Inc. and/or its affiliates
 * and other contributors as indicated by the @author tags.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *
 * This file is based on the original keycloak-js adapter. Changes include:
 *  - use TypeScript instead of JavaScript
 *  - use Angular's Http service instead of the browser's XMLHttpRequest
 *  - mainly work with Observables instead of promises
 *  - some custom business logic (e.g. for background login)
 */

import {
  KeycloakAdapter,
  KeycloakError,
  KeycloakLoginOptions,
  KeycloakLogoutOptions,
  KeycloakPromise,
  KeycloakRegisterOptions,
} from 'keycloak-js';
import { KeycloakService } from 'keycloak-angular';
import {
  EMPTY,
  finalize,
  mapTo,
  merge,
  mergeMap,
  Observable,
  takeUntil,
  throwError,
  timeout,
} from 'rxjs';
import { catchError, filter, first, map, tap } from 'rxjs/operators';
import {
  InAppBrowser,
  InAppBrowserObject,
  InAppBrowserOptions,
} from '@awesome-cordova-plugins/in-app-browser/ngx';
import { TranslateService } from '@ngx-translate/core';

import { KeycloakPromiseImpl } from './keycloak-promise';
import { LoginFailedError } from '../errors/login-failed-error';
import { CallbackStorage } from './callback-storage';
import { OAuthAccessToken, OAuthParams } from './keycloak.model';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';

/**
 * Custom Keycloak adapter that uses the InAppBrowser plugin to open the login page.
 *
 * Only works on Android and iOS. Only supports the standard flow.
 */
export class PiaKeycloakAdapter implements KeycloakAdapter {
  private static readonly REDIRECT_URL = 'http://localhost';

  private readonly callbackStorage = new CallbackStorage();

  private readonly jwt: JwtHelperService = new JwtHelperService();

  constructor(
    private readonly keycloakService: KeycloakService,
    private readonly inAppBrowser: InAppBrowser,
    private readonly translate: TranslateService,
    private readonly http: HttpClient,
    private readonly realmUrl: string
  ) {}

  login(options?: KeycloakLoginOptions): KeycloakPromise<void, void> {
    /**
     * The login has a timeout of 2 seconds if it is done in the background
     * (on app start). Otherwise, the timeout is 15 minutes.
     */
    const timeoutDuration =
      options?.cordovaOptions?.hidden === 'yes' ? 2000 : 15 * 60 * 1000;

    const loginUrl = this.keycloakService
      .getKeycloakInstance()
      .createLoginUrl(options); // will also add oauth state to callback storage

    const browser = this.getInAppBrowserWithDefaultAppearance(loginUrl, {
      ...options?.cordovaOptions,
    });

    return KeycloakPromiseImpl.fromObservable(
      merge(
        browser
          .on('loadstart')
          .pipe(
            filter((event) =>
              event.url.includes(PiaKeycloakAdapter.REDIRECT_URL)
            )
          ),
        browser.on('loaderror').pipe(
          map((event) => {
            if (event.url.includes(PiaKeycloakAdapter.REDIRECT_URL)) {
              return event;
            } else {
              throw new LoginFailedError();
            }
          })
        ),
        browser.on('exit').pipe(
          map(() => {
            throw new LoginFailedError('closed_by_user');
          })
        )
      ).pipe(
        first(),
        tap(() => browser.close()),
        timeout(timeoutDuration),
        mergeMap((event) => {
          const callback = this.parseCallback(event.url);
          return this.processCallback(callback);
        }),
        finalize(() => browser.close())
      )
    );
  }

  logout(options?: KeycloakLogoutOptions): KeycloakPromise<void, void> {
    let logoutUrl = this.keycloakService
      .getKeycloakInstance()
      .createLogoutUrl(options);

    const browser = this.getInAppBrowserWithDefaultAppearance(logoutUrl, {
      hidden: 'yes',
    });

    return KeycloakPromiseImpl.fromObservable(
      merge(
        browser
          .on('loadstart')
          .pipe(
            filter((event) =>
              event.url.includes(PiaKeycloakAdapter.REDIRECT_URL)
            )
          ),
        browser.on('loaderror').pipe(
          map((event) => {
            if (
              event.url === '' ||
              event.url.includes(PiaKeycloakAdapter.REDIRECT_URL)
            ) {
              return event;
            } else {
              throw new LoginFailedError();
            }
          })
        )
      ).pipe(
        tap(() => this.keycloakService.clearToken()),
        mapTo(void 0),
        finalize(() => browser.close())
      )
    );
  }

  register(options?: KeycloakRegisterOptions): KeycloakPromise<void, void> {
    console.warn('it is not possible to register via mobile app');
    return KeycloakPromiseImpl.reject();
  }

  accountManagement(): KeycloakPromise<void, void> {
    const accountUrl = this.keycloakService
      .getKeycloakInstance()
      .createAccountUrl();

    const browser = this.getInAppBrowserWithDefaultAppearance(accountUrl, {
      toolbar: 'no',
    });

    return KeycloakPromiseImpl.fromObservable(
      browser.on('loadstart').pipe(
        takeUntil(browser.on('exit')),
        filter((event) => event.url.includes(PiaKeycloakAdapter.REDIRECT_URL)),
        tap(() => browser.close()),
        map(() => void 0)
      )
    );
  }

  redirectUri(options: { redirectUri: string }, encodeHash: boolean): string {
    return PiaKeycloakAdapter.REDIRECT_URL;
  }

  private getInAppBrowserWithDefaultAppearance(
    url: string,
    options?: InAppBrowserOptions
  ): InAppBrowserObject {
    return this.inAppBrowser.create(
      url,
      '_blank',
      this.getInAppBrowserToolbarOptions(options)
    );
  }

  private getInAppBrowserToolbarOptions(
    overwrites: InAppBrowserOptions = {}
  ): Record<string, string> {
    return {
      closebuttoncaption: this.translate.instant('GENERAL.GO_BACK'),
      closebuttoncolor: '#ffffff',
      toolbarcolor: '#599118',
      hidenavigationbuttons: 'yes',
      toolbarposition: 'top',
      location: 'no',
      ...overwrites,
    };
  }

  private parseCallback(callbackUrl: string): OAuthParams | undefined {
    const oauth = this.parseCallbackUrl(callbackUrl);

    if (!oauth) {
      return;
    }

    const oauthState = this.callbackStorage.getOAuthState(oauth.state);

    if (oauthState) {
      oauth.valid = true;
      oauth.storedNonce = oauthState.nonce;
      oauth.prompt = oauthState.prompt;
      oauth.pkceCodeVerifier = oauthState.pkceCodeVerifier;
    }

    return oauth;
  }

  private parseCallbackUrl(url: string): OAuthParams | undefined {
    const supportedParams = [
      'code',
      'state',
      'session_state',
      'kc_action_status',
      'error',
      'error_description',
      'error_uri',
    ];

    const queryIndex = url.indexOf('?');
    const fragmentIndex = url.indexOf('#');

    let newUrl;
    let parsed;

    if (queryIndex !== -1) {
      newUrl = url.substring(0, queryIndex);
      parsed = this.parseCallbackParams(
        url.substring(
          queryIndex + 1,
          fragmentIndex !== -1 ? fragmentIndex : url.length
        ),
        supportedParams
      );

      if (parsed.paramsString !== '') {
        newUrl += '?' + parsed.paramsString;
      }

      if (fragmentIndex !== -1) {
        newUrl += url.substring(fragmentIndex);
      }
    } else if (fragmentIndex !== -1) {
      newUrl = url.substring(0, fragmentIndex);
      parsed = this.parseCallbackParams(
        url.substring(fragmentIndex + 1),
        supportedParams
      );

      if (parsed.paramsString !== '') {
        newUrl += '#' + parsed.paramsString;
      }
    }

    if (parsed && parsed.oauthParams) {
      if (
        (parsed.oauthParams.code || parsed.oauthParams.error) &&
        parsed.oauthParams.state
      ) {
        parsed.oauthParams.newUrl = newUrl;
        return parsed.oauthParams;
      }
    }
  }

  private parseCallbackParams(paramsString, supportedParams) {
    const p = paramsString.split('&');
    const result = {
      paramsString: '',
      oauthParams: {},
    };
    for (let i = 0; i < p.length; i++) {
      const split = p[i].indexOf('=');
      const key = p[i].slice(0, split);

      if (supportedParams.indexOf(key) !== -1) {
        result.oauthParams[key] = p[i].slice(split + 1);
      } else {
        if (result.paramsString !== '') {
          result.paramsString += '&';
        }
        result.paramsString += p[i];
      }
    }
    return result;
  }

  private processCallback(oauth: OAuthParams | undefined): Observable<void> {
    if (!oauth) {
      return EMPTY;
    }

    const kc = this.keycloakService.getKeycloakInstance();
    let timeLocal = new Date().getTime();

    if (oauth.error) {
      if (oauth.prompt != 'none') {
        return this.throwError({
          error: oauth.error,
          error_description: oauth.error_description,
        });
      }
      return EMPTY;
    }

    if (kc.flow == 'implicit' || !oauth.code) {
      return EMPTY;
    }

    const url = `${this.realmUrl}/protocol/openid-connect/token`;
    const body = new URLSearchParams();
    body.set('code', oauth.code);
    body.set('grant_type', 'authorization_code');
    body.set('client_id', kc.clientId);
    body.set('redirect_uri', PiaKeycloakAdapter.REDIRECT_URL);

    if (oauth.pkceCodeVerifier) {
      body.set('code_verifier', oauth.pkceCodeVerifier);
    }

    return this.http
      .post(url, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .pipe(
        map((token: OAuthAccessToken) => {
          const {
            access_token: accessToken,
            refresh_token: refreshToken,
            id_token: idToken,
          } = token;
          timeLocal = (timeLocal + new Date().getTime()) / 2;
          this.setToken(accessToken, refreshToken, idToken, timeLocal);

          if (
            (kc.tokenParsed && kc.tokenParsed.nonce != oauth.storedNonce) ||
            (kc.refreshTokenParsed &&
              kc.refreshTokenParsed.nonce != oauth.storedNonce) ||
            (kc.idTokenParsed && kc.idTokenParsed.nonce != oauth.storedNonce)
          ) {
            kc.clearToken();
            console.info('[KEYCLOAK] Invalid nonce, clearing token');
            throw new Error('[KEYCLOAK] Invalid nonce, clearing token');
          } else {
            kc.onAuthSuccess && kc.onAuthSuccess();
          }
        }),
        catchError((error) => {
          return this.throwError({
            error: error,
            error_description: 'request to update token failed',
          });
        })
      );
  }

  private setToken(token, refreshToken, idToken, timeLocal) {
    const kc = this.keycloakService.getKeycloakInstance();

    if (refreshToken) {
      kc.refreshToken = refreshToken;
      kc.refreshTokenParsed = this.jwt.decodeToken(refreshToken);
    } else {
      delete kc.refreshToken;
      delete kc.refreshTokenParsed;
    }

    if (idToken) {
      kc.idToken = idToken;
      kc.idTokenParsed = this.jwt.decodeToken(idToken);
    } else {
      delete kc.idToken;
      delete kc.idTokenParsed;
    }

    if (token) {
      kc.token = token;
      kc.tokenParsed = this.jwt.decodeToken(token);
      kc.sessionId = kc.tokenParsed.session_state;
      kc.authenticated = true;
      kc.subject = kc.tokenParsed.sub;
      kc.realmAccess = kc.tokenParsed.realm_access;
      kc.resourceAccess = kc.tokenParsed.resource_access;

      if (timeLocal) {
        kc.timeSkew = Math.floor(timeLocal / 1000) - kc.tokenParsed.iat;
      }

      if (kc.timeSkew != null) {
        console.info(
          '[KEYCLOAK] Estimated time difference between browser and server is ' +
            kc.timeSkew +
            ' seconds'
        );

        if (kc.onTokenExpired) {
          const expiresIn =
            (kc.tokenParsed.exp - new Date().getTime() / 1000 + kc.timeSkew) *
            1000;
          console.info(
            '[KEYCLOAK] Token expires in ' + Math.round(expiresIn / 1000) + ' s'
          );
          if (expiresIn <= 0) {
            kc.onTokenExpired();
          }
        }
      }
    } else {
      delete kc.token;
      delete kc.tokenParsed;
      delete kc.subject;
      delete kc.realmAccess;
      delete kc.resourceAccess;

      kc.authenticated = false;
    }
  }

  private throwError(error: KeycloakError): Observable<void> {
    const kc = this.keycloakService.getKeycloakInstance();
    kc.onAuthError && kc.onAuthError(error);
    return throwError(error);
  }
}
