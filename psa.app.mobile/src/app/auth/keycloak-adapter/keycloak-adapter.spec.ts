/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  discardPeriodicTasks,
  fakeAsync,
  flush,
  tick,
} from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { PiaKeycloakAdapter } from './keycloak-adapter';
import { KeycloakService } from 'keycloak-angular';
import {
  InAppBrowser,
  InAppBrowserEvent,
  InAppBrowserObject,
} from '@awesome-cordova-plugins/in-app-browser/ngx';
import Keycloak, { KeycloakLoginOptions } from 'keycloak-js';
import { NEVER, of, Subject } from 'rxjs';
import SpyObj = jasmine.SpyObj;
import { LoginFailedError } from '../errors/login-failed-error';
import { OAuthState } from './keycloak.model';

describe('PiaKeycloakAdapter', () => {
  let adapter: PiaKeycloakAdapter;

  let keycloakService: SpyObj<KeycloakService>;
  let keycloakInstance: SpyObj<Keycloak>;
  let inAppBrowser: SpyObj<InAppBrowser>;
  let browser: SpyObj<InAppBrowserObject>;
  let browserEvents$: Subject<InAppBrowserEvent>;
  let translate: SpyObj<TranslateService>;
  let http: SpyObj<HttpClient>;

  let realmUrl = 'https://pia-app/auth/realms/pia';

  beforeEach(() => {
    keycloakService = jasmine.createSpyObj('KeycloakService', [
      'clearToken',
      'getKeycloakInstance',
    ]);
    keycloakInstance = jasmine.createSpyObj(
      'Keycloak',
      [
        'createLoginUrl',
        'createLogoutUrl',
        'createAccountUrl',
        'clearToken',
        'onAuthSuccess',
        'onAuthError',
        'onTokenExpired',
      ],
      {
        flow: 'standard',
        clientId: 'pia-app',
        tokenParsed: createTokenPayload(),
      }
    );
    keycloakService.getKeycloakInstance.and.returnValue(keycloakInstance);
    keycloakInstance.createLoginUrl.and.returnValue(realmUrl + '/login');
    keycloakInstance.createLogoutUrl.and.returnValues(realmUrl + '/logout');
    keycloakInstance.createAccountUrl.and.returnValues(realmUrl + '/account');

    inAppBrowser = jasmine.createSpyObj('InAppBrowser', ['create']);
    browser = jasmine.createSpyObj('InAppBrowserObject', [
      'show',
      'close',
      'hide',
      'on',
    ]);
    browserEvents$ = new Subject();
    inAppBrowser.create.and.returnValue(browser);

    translate = jasmine.createSpyObj('TranslateService', ['instant']);
    translate.instant.and.returnValue('go back');

    http = jasmine.createSpyObj('HttpClient', ['post']);
    http.post.and.returnValue(of({}));

    adapter = new PiaKeycloakAdapter(
      keycloakService,
      inAppBrowser,
      translate,
      http,
      realmUrl
    );
  });

  describe('login', () => {
    it('should open an in-app browser with correct appearance', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, loaderror, exit)
      browser.on.and.returnValues(browserEvents$.asObservable(), NEVER, NEVER);

      // Act
      adapter.login(
        createKeycloakLoginOptions({
          hidden: 'yes',
        })
      );
      sendBrowserEvent({
        type: 'loadstart',
        url: 'http://localhost',
      });

      // Assert
      expect(inAppBrowser.create).toHaveBeenCalledWith(
        'https://pia-app/auth/realms/pia/login',
        '_blank',
        {
          closebuttoncaption: 'go back',
          closebuttoncolor: '#ffffff',
          toolbarcolor: '#599118',
          hidenavigationbuttons: 'yes',
          toolbarposition: 'top',
          location: 'no',
          hidden: 'yes',
        }
      );
    }));

    it('should parse the event url and request an access token', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, loaderror, exit)
      browser.on.and.returnValues(browserEvents$.asObservable(), NEVER, NEVER);

      // Act
      adapter.login(createKeycloakLoginOptions());
      sendBrowserEvent({
        type: 'loadstart',
        url: 'http://localhost?code=1234&state=5678',
      });

      // Assert
      expect(http.post).toHaveBeenCalledOnceWith(
        'https://pia-app/auth/realms/pia/protocol/openid-connect/token',
        'code=1234&grant_type=authorization_code&client_id=pia-app&redirect_uri=http%3A%2F%2Flocalhost',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      expect(keycloakInstance.onAuthSuccess).toHaveBeenCalled();
    }));

    it('should respect an existing oauth state', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, loaderror, exit)
      browser.on.and.returnValues(browserEvents$.asObservable(), NEVER, NEVER);
      localStorage.setItem(
        'kc-callback-5678',
        JSON.stringify(createOAuthState())
      );

      // Act
      adapter.login(createKeycloakLoginOptions());
      sendBrowserEvent({
        type: 'loadstart',
        url: 'http://localhost?code=1234&state=5678',
      });

      // Assert
      expect(http.post).toHaveBeenCalledOnceWith(
        'https://pia-app/auth/realms/pia/protocol/openid-connect/token',
        'code=1234&grant_type=authorization_code&client_id=pia-app&redirect_uri=http%3A%2F%2Flocalhost&code_verifier=5678',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      expect(keycloakInstance.onAuthSuccess).toHaveBeenCalled();
    }));

    it('should treat "loaderror" event with correct redirect url as success', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, loaderror, exit)
      browser.on.and.returnValues(NEVER, browserEvents$.asObservable(), NEVER);

      // Act
      adapter.login(createKeycloakLoginOptions());
      sendBrowserEvent({
        type: 'loaderror',
        url: 'http://localhost?code=1234&state=5678',
      });

      // Assert
      expect(http.post).toHaveBeenCalled();
      expect(keycloakInstance.onAuthSuccess).toHaveBeenCalled();
    }));

    it('should treat "loaderror" event without redirect url as error', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, loaderror, exit)
      browser.on.and.returnValues(NEVER, browserEvents$.asObservable(), NEVER);
      const errorSpy = jasmine.createSpy('error');

      // Act
      adapter.login(createKeycloakLoginOptions()).catch(errorSpy);
      sendBrowserEvent({
        type: 'loaderror',
        url: 'https://pia-app/auth/realms/pia',
      });

      // Assert
      expect(errorSpy).toHaveBeenCalledOnceWith(new LoginFailedError());
      expect(http.post).not.toHaveBeenCalled();
      expect(keycloakInstance.onAuthSuccess).not.toHaveBeenCalled();
    }));

    it('should throw login errors ', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, loaderror, exit)
      browser.on.and.returnValues(NEVER, browserEvents$.asObservable(), NEVER);
      const errorSpy = jasmine.createSpy('error');

      // Act
      adapter.login(createKeycloakLoginOptions()).error(errorSpy);
      sendBrowserEvent({
        type: 'loaderror',
        url: 'http://localhost?state=5678&error=access_denied&error_description=Access+denied',
      });

      // Assert
      expect(http.post).not.toHaveBeenCalled();
      expect(keycloakInstance.onAuthError).toHaveBeenCalledOnceWith({
        error: 'access_denied',
        error_description: 'Access+denied',
      });
      expect(errorSpy).toHaveBeenCalledOnceWith({
        error: 'access_denied',
        error_description: 'Access+denied',
      });
    }));

    it('should throw with specific error message if browser was closed by the user', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, loaderror, exit)
      browser.on.and.returnValues(NEVER, NEVER, browserEvents$.asObservable());
      const errorSpy = jasmine.createSpy('error');

      // Act
      adapter.login(createKeycloakLoginOptions()).catch(errorSpy);
      sendBrowserEvent({
        type: 'exit',
      });

      // Assert
      expect(errorSpy).toHaveBeenCalledOnceWith(
        new LoginFailedError('closed_by_user')
      );
      expect(http.post).not.toHaveBeenCalled();
      expect(keycloakInstance.onAuthSuccess).not.toHaveBeenCalled();
    }));

    it('should call onTokenExpired if expiration date has been reached', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, loaderror, exit)
      browser.on.and.returnValues(browserEvents$.asObservable(), NEVER, NEVER);
      localStorage.setItem(
        'kc-callback-5678',
        JSON.stringify(createOAuthState())
      );
      http.post.and.returnValue(
        of({
          access_token: createJwtToken(),
        })
      );

      // Act
      adapter.login(createKeycloakLoginOptions());
      sendBrowserEvent({
        type: 'loadstart',
        url: 'http://localhost?code=1234&state=5678',
      });

      // Assert
      expect(keycloakInstance.onTokenExpired).toHaveBeenCalled();
      expect(keycloakInstance.onAuthSuccess).toHaveBeenCalled();
    }));
  });

  describe('logout', () => {
    it('should open an hidden in-app browser', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, loaderror)
      browser.on.and.returnValues(browserEvents$.asObservable(), NEVER);

      // Act
      adapter.logout();
      sendBrowserEvent({
        type: 'loadstart',
        url: 'http://localhost',
      });

      // Assert
      expect(inAppBrowser.create).toHaveBeenCalledWith(
        'https://pia-app/auth/realms/pia/logout',
        '_blank',
        {
          closebuttoncaption: 'go back',
          closebuttoncolor: '#ffffff',
          toolbarcolor: '#599118',
          hidenavigationbuttons: 'yes',
          toolbarposition: 'top',
          location: 'no',
          hidden: 'yes',
        }
      );
    }));

    it('should clear the session token and close the hidden browser', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, loaderror)
      browser.on.and.returnValues(browserEvents$.asObservable(), NEVER);

      // Act
      adapter.logout();
      sendBrowserEvent({
        type: 'loadstart',
        url: 'http://localhost',
      });

      // Assert
      expect(keycloakService.clearToken).toHaveBeenCalled();
      expect(browser.close).toHaveBeenCalled();
    }));

    it('should treat "loaderror" event with correct redirect url as success', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, loaderror)
      browser.on.and.returnValues(NEVER, browserEvents$.asObservable());

      // Act
      adapter.logout();
      sendBrowserEvent({
        type: 'loaderror',
        url: 'http://localhost?code=1234&state=5678',
      });

      // Assert
      expect(keycloakService.clearToken).toHaveBeenCalled();
      expect(browser.close).toHaveBeenCalled();
    }));

    it('should treat "loaderror" event with empty redirect url as success', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, loaderror)
      browser.on.and.returnValues(NEVER, browserEvents$.asObservable());

      // Act
      adapter.logout();
      sendBrowserEvent({
        type: 'loaderror',
        url: '',
      });

      // Assert
      expect(keycloakService.clearToken).toHaveBeenCalled();
      expect(browser.close).toHaveBeenCalled();
    }));

    it('should treat "loaderror" event with invalid redirect url as error', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, loaderror, exit)
      browser.on.and.returnValues(NEVER, browserEvents$.asObservable(), NEVER);
      const errorSpy = jasmine.createSpy('error');

      // Act
      adapter.logout().catch(errorSpy);
      sendBrowserEvent({
        type: 'loaderror',
        url: 'https://not-the-right.url',
      });

      // Assert
      expect(errorSpy).toHaveBeenCalledOnceWith(new LoginFailedError());
      expect(keycloakService.clearToken).not.toHaveBeenCalled();
      expect(browser.close).toHaveBeenCalled();
    }));
  });

  describe('register', () => {
    it('should reject registration requests', async () => {
      // Act
      const promise = adapter.register();

      // Assert
      await expectAsync(promise).toBeRejected();
    });
  });

  describe('accountManagement', () => {
    it('should open the account console in an in-app browser without toolbar', fakeAsync(() => {
      // Arrange
      // event subscription order: (loadstart, exit)
      browser.on.and.returnValues(browserEvents$.asObservable(), NEVER);

      // Act
      adapter.accountManagement();
      sendBrowserEvent({
        type: 'loadstart',
        url: 'http://localhost',
      });

      // Assert
      expect(inAppBrowser.create).toHaveBeenCalledWith(
        'https://pia-app/auth/realms/pia/account',
        '_blank',
        {
          closebuttoncaption: 'go back',
          closebuttoncolor: '#ffffff',
          toolbar: 'no',
          toolbarcolor: '#599118',
          hidenavigationbuttons: 'yes',
          toolbarposition: 'top',
          location: 'no',
        }
      );
    }));
  });

  describe('redirectUri', () => {
    it('should return the localhost url', () => {
      expect(
        adapter.redirectUri({ redirectUri: 'what-is-this-for?' }, true)
      ).toEqual('http://localhost');
    });
  });

  function createKeycloakLoginOptions(
    cordovaOptions: Record<string, string> = {}
  ): KeycloakLoginOptions {
    return {
      loginHint: 'Test-1234',
      locale: 'de-DE',
      cordovaOptions,
    };
  }

  function createOAuthState(): OAuthState {
    return {
      redirectUri: 'http://localhost',
      nonce: 'nonce',
      prompt: 'login',
      pkceCodeVerifier: '5678',
      expires: 360,
    };
  }

  function createTokenPayload() {
    return {
      exp: 1700000000,
      iat: 1700000000,
      iss: 'https://localhost/api/v1/auth/realms/pia-realm',
      typ: 'Bearer',
      scope: 'openid profile email',
      studies: ['Teststudy'],
      client_id: 'pia-web-app-client',
      username: 'Test-1234',
      locale: 'de-DE',
      active: true,
      session_state: 'abc',
      sub: 'sub',
      realm_access: {
        roles: ['Proband'],
      },
      resource_access: {
        account: {
          roles: ['manage-account', 'manage-account-links', 'view-profile'],
        },
      },
      nonce: 'nonce',
    };
  }

  function createJwtToken(): string {
    return (
      'Bearer ' +
      toBase64(JSON.stringify({ alg: 'RS512', typ: 'JWT' })) +
      '.' +
      toBase64(JSON.stringify(createTokenPayload())) +
      '.' +
      toBase64('signature')
    );
  }

  function toBase64(value: string): string {
    return btoa(value).replace(/=/g, '');
  }

  function sendBrowserEvent(event: Partial<InAppBrowserEvent>) {
    browserEvents$.next(event as InAppBrowserEvent);
    tick();
    discardPeriodicTasks();
  }
});
