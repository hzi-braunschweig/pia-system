/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { KeycloakClientService } from './keycloak-client.service';
import {
  KeycloakAngularModule,
  KeycloakEvent,
  KeycloakEventType,
  KeycloakService,
} from 'keycloak-angular';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';
import { LoginFailedError } from './errors/login-failed-error';
import { TranslateService } from '@ngx-translate/core';
import { MockProvider, MockService } from 'ng-mocks';
import { Platform } from '@ionic/angular';
import { CurrentUser } from './current-user.service';
import Keycloak from 'keycloak-js';
import { PiaKeycloakAdapter } from './keycloak-adapter/keycloak-adapter';
import Spy = jasmine.Spy;
import SpyObj = jasmine.SpyObj;

describe('KeycloakClientService', () => {
  const endpointUrl = 'http://localhost';

  let service: KeycloakClientService;

  let keycloakService: SpyObj<KeycloakService>;
  let endpoint: EndpointService;
  let inAppBrowser: InAppBrowser;
  let currentUser: CurrentUser;
  let httpMock: HttpTestingController;

  let keycloakEvents$: Subject<KeycloakEvent>;

  beforeEach(() => {
    keycloakEvents$ = new Subject<KeycloakEvent>();
    keycloakService = jasmine.createSpyObj(
      'KeycloakService',
      [
        'keycloakService.',
        'updateToken',
        'getToken',
        'init',
        'isLoggedIn',
        'isTokenExpired',
        'login',
        'getToken',
        'getKeycloakInstance',
        'logout',
      ],
      {
        keycloakEvents$: keycloakEvents$.asObservable(),
      }
    );

    TestBed.configureTestingModule({
      imports: [KeycloakAngularModule, HttpClientTestingModule],
      providers: [
        InAppBrowser,
        {
          provide: TranslateService,
          useValue: MockService(TranslateService),
        },
        {
          provide: Platform,
          useValue: { ready: () => Promise.resolve() },
        },
        MockProvider(KeycloakService, keycloakService),
      ],
    });
    service = TestBed.inject(KeycloakClientService);
    endpoint = TestBed.inject(EndpointService);
    httpMock = TestBed.inject(HttpTestingController);
    inAppBrowser = TestBed.inject(InAppBrowser);
    currentUser = TestBed.inject(CurrentUser);

    endpoint.setCustomEndpoint(endpointUrl);

    environment.authServer.realm = 'dummy-realm';
    environment.authServer.clientId = 'dummy-client';
  });

  describe('initialize', () => {
    it('should initialize keycloak', async () => {
      await service.initialize();
      expect(keycloakService.init).toHaveBeenCalledWith({
        config: {
          realm: environment.authServer.realm,
          clientId: environment.authServer.clientId,
          url: `${endpointUrl}/api/v1/auth/`,
        },
        initOptions: {
          adapter: jasmine.any(PiaKeycloakAdapter),
          pkceMethod: 'S256',
          checkLoginIframe: false,
        },
        shouldAddToken: jasmine.any(Function),
      });
    });

    it('should set initialization flag to true', async () => {
      expect(service.hasBeenInitialized).toBeFalse();
      await service.initialize();
      expect(service.hasBeenInitialized).toBeTrue();
    });

    it('should do nothing when initialization flag is true', async () => {
      await service.initialize();
      await service.initialize();
      expect(keycloakService.init).toHaveBeenCalledTimes(1);
    });

    it('should throw errors', async () => {
      const expectedError = { foo: 'bar' };
      keycloakService.init.and.rejectWith(expectedError);

      try {
        await service.initialize();
      } catch (e) {
        expect(e).toBe(expectedError);
      }
    });

    describe('keycloak events', () => {
      it('should refresh token on token expired event', async () => {
        await service.initialize();

        keycloakEvents$.next({ type: KeycloakEventType.OnTokenExpired });

        expect(keycloakService.updateToken).toHaveBeenCalledTimes(1);
      });

      it('should logout on token refresh error', async () => {
        await service.initialize();

        keycloakEvents$.next({ type: KeycloakEventType.OnAuthRefreshError });

        expect(keycloakService.logout).toHaveBeenCalledTimes(1);
      });

      it('should reinitialize current user on token refresh success', fakeAsync(async () => {
        const expectedTokenValue = 'fake-token-value';
        const handleTokenSpy = spyOn(currentUser, 'init');

        keycloakService.getToken.and.resolveTo(expectedTokenValue);
        await service.initialize();

        keycloakEvents$.next({ type: KeycloakEventType.OnAuthRefreshSuccess });

        tick();

        expect(handleTokenSpy).toHaveBeenCalledOnceWith(expectedTokenValue);
      }));
    });
  });

  describe('isLoggedIn', () => {
    it('should return false if not initialized', async () => {
      const result = await service.isLoggedIn();

      expect(result).toBeFalse();
    });

    it('should return false if not logged in', async () => {
      await service.initialize();
      keycloakService.isLoggedIn.and.returnValue(false);

      const result = await service.isLoggedIn();

      expect(result).toBeFalse();
    });

    it('should return true if logged in', async () => {
      await service.initialize();
      keycloakService.isLoggedIn.and.returnValue(true);

      const result = await service.isLoggedIn();

      expect(result).toBeTrue();
    });
  });

  describe('login', () => {
    const loginHint = 'test-1234567';
    const locale = 'de-DE';
    const token =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTY1NjQwNzk4NywiZXhwIjoxNjU2NDExNTg3fQ.0Blo63XFPdo6JtYj-0rPP3gu_LZMhT1U4zvBS8JnvHQ';

    let handleKeycloakTokenSpy: Spy;

    beforeEach(() => {
      keycloakService.init.and.resolveTo();
      keycloakService.login.and.resolveTo(undefined);
      keycloakService.getToken.and.resolveTo(token);

      handleKeycloakTokenSpy = spyOn(currentUser, 'init');
    });

    it('should login successfully ', async () => {
      await service.initialize();

      await service.login(true, loginHint, locale);

      expect(keycloakService.login).toHaveBeenCalledWith({
        loginHint,
        locale,
        cordovaOptions: {
          hidden: 'yes',
        },
      });

      expect(handleKeycloakTokenSpy).toHaveBeenCalledWith(token);
    });

    it('should throw an error if not already initialized', async () => {
      try {
        await service.login(false, loginHint, locale);
      } catch (e) {
        expect(e).toBeInstanceOf(LoginFailedError);
      }
    });

    it('should throw an error when login failed', async () => {
      keycloakService.login.and.rejectWith(undefined);
      await service.initialize();

      try {
        await service.login(false, loginHint, locale);
      } catch (e) {
        expect(e).toBeInstanceOf(LoginFailedError);
      }
    });

    it('should throw the same error when it is not undefined', async () => {
      const expectedError = { foo: 'bar' };
      keycloakService.login.and.rejectWith(expectedError);
      await service.initialize();

      try {
        await service.login(false, loginHint, locale);
      } catch (e) {
        expect(e).toBe(expectedError);
      }
    });
  });

  describe('openAccountManagement', () => {
    it('should open accountManagement with InAppBrowser', async () => {
      keycloakService.getKeycloakInstance.and.returnValue({
        accountManagement: () => Promise.resolve(),
      } as Keycloak);

      await service.openAccountManagement();
    });
  });

  describe('logout', () => {
    let removeEndpointSpy: Spy;

    beforeEach(() => {
      removeEndpointSpy = spyOn(endpoint, 'removeLatestEndpoint');
    });

    it('should initialize if not already done', async () => {
      await service.logout();

      expect(keycloakService.init).toHaveBeenCalled();
      expect(keycloakService.logout).toHaveBeenCalled();
      expect(removeEndpointSpy).toHaveBeenCalled();
    });

    it('should open logout with InAppBrowser', async () => {
      keycloakService.init.and.resolveTo();

      await service.logout();

      expect(keycloakService.logout).toHaveBeenCalled();
      expect(removeEndpointSpy).toHaveBeenCalled();
    });

    it('should close browser and reject on error', async () => {
      keycloakService.logout.and.rejectWith('some error');

      try {
        await service.logout();
        // we want the promise to be rejected
        expect(true).toBeFalse();
      } catch {
        expect(removeEndpointSpy).not.toHaveBeenCalled();
      }
    });
  });
});
