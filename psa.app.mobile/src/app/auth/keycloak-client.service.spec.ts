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
import {
  InAppBrowser,
  InAppBrowserEvent,
  InAppBrowserEventType,
  InAppBrowserObject,
} from '@awesome-cordova-plugins/in-app-browser/ngx';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { LoginFailedError } from './errors/login-failed-error';
import { NoErrorToastHeader } from '../shared/interceptors/http-error-interceptor.service';
import { TranslateService } from '@ngx-translate/core';
import { MockService } from 'ng-mocks';
import Spy = jasmine.Spy;
import createSpy = jasmine.createSpy;
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;

describe('KeycloakClientService', () => {
  const endpointUrl = 'http://localhost';
  const logoutUrl = 'https://localhost/logout';
  const accountUrl = 'https://localhost/account';
  let service: KeycloakClientService;
  let authService: AuthService;
  let keycloakService: KeycloakService;
  let endpointService: EndpointService;
  let inAppBrowser: InAppBrowser;
  let httpMock: HttpTestingController;
  let keycloakInitSpy: Spy;
  let inAppBrowserCreateSpy: Spy;
  let browserSpy: SpyObj<InAppBrowserObject>;
  let loadStart: BehaviorSubject<InAppBrowserEvent>;
  let loadError: BehaviorSubject<InAppBrowserEvent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KeycloakAngularModule, HttpClientTestingModule],
      providers: [
        InAppBrowser,
        {
          provide: TranslateService,
          useValue: MockService(TranslateService),
        },
      ],
    });
    service = TestBed.inject(KeycloakClientService);
    authService = TestBed.inject(AuthService);
    keycloakService = TestBed.inject(KeycloakService);
    endpointService = TestBed.inject(EndpointService);
    httpMock = TestBed.inject(HttpTestingController);
    inAppBrowser = TestBed.inject(InAppBrowser);
    endpointService.setCustomEndpoint(endpointUrl);

    environment.authServer.realm = 'dummy-realm';
    environment.authServer.clientId = 'dummy-client';

    keycloakInitSpy = spyOn(keycloakService, 'init');
    keycloakInitSpy.and.resolveTo(undefined);

    loadStart = new BehaviorSubject({
      url: 'http://localhost',
    } as InAppBrowserEvent);
    loadError = new BehaviorSubject({
      url: 'http://localhost',
    } as InAppBrowserEvent);

    browserSpy = createSpyObj<InAppBrowserObject>([
      'show',
      'hide',
      'close',
      'on',
    ]);

    browserSpy.on.and.callFake((event: InAppBrowserEventType) => {
      switch (event) {
        case 'loadstart':
          return loadStart;

        case 'loaderror':
          return loadError;
      }
    });

    inAppBrowserCreateSpy = spyOn(inAppBrowser, 'create');
    inAppBrowserCreateSpy.and.returnValue(browserSpy);

    const createLogoutUrlSpy = createSpy('createLogoutUrl');
    createLogoutUrlSpy.and.returnValue(logoutUrl);

    const createAccountUrlSpy = createSpy('createAccountUrl');
    createAccountUrlSpy.and.returnValue(accountUrl);

    const spy = spyOn(keycloakService, 'getKeycloakInstance');
    spy.and.returnValue({
      createLogoutUrl: createLogoutUrlSpy,
      createAccountUrl: createAccountUrlSpy,
    } as any);

    spyOn(document, 'addEventListener').and.callFake((type, listener) =>
      listener()
    );
  });

  describe('initialize', () => {
    it('should initialize keycloak', () => {
      service.initialize();
      expect(keycloakInitSpy).toHaveBeenCalledWith({
        config: {
          realm: environment.authServer.realm,
          clientId: environment.authServer.clientId,
          url: `${endpointUrl}/api/v1/auth/`,
        },
        initOptions: {
          pkceMethod: 'S256',
          checkLoginIframe: false,
        },
        shouldAddToken: jasmine.any(Function),
      });
    });

    it('should add before logout entry', async () => {
      const onBeforeLogoutSpy = spyOn(authService, 'onBeforeLogout');
      await service.initialize();
      expect(onBeforeLogoutSpy).toHaveBeenCalledWith(jasmine.any(Function));
    });

    it('should set initialization flag to true', async () => {
      expect(service.hasBeenInitialized).toBeFalse();
      await service.initialize();
      expect(service.hasBeenInitialized).toBeTrue();
    });

    it('should do nothing when initialization flag is true', async () => {
      await service.initialize();
      await service.initialize();
      expect(keycloakInitSpy).toHaveBeenCalledTimes(1);
    });

    describe('keycloak events', () => {
      let keycloakEvents$: Subject<KeycloakEvent>;

      beforeEach(() => {
        keycloakEvents$ = new Subject<KeycloakEvent>();
        spyOnProperty(keycloakService, 'keycloakEvents$').and.returnValue(
          keycloakEvents$
        );
      });

      it('should refresh token on token expired event', async () => {
        const updateTokenSpy = spyOn(keycloakService, 'updateToken');
        await service.initialize();

        keycloakEvents$.next({ type: KeycloakEventType.OnTokenExpired });

        expect(updateTokenSpy).toHaveBeenCalledTimes(1);
      });

      it('should logout on token refresh error', async () => {
        const logoutSpy = spyOn(authService, 'logout');
        await service.initialize();

        keycloakEvents$.next({ type: KeycloakEventType.OnAuthRefreshError });

        expect(logoutSpy).toHaveBeenCalledTimes(1);
      });

      it('should update used token on token refresh success', fakeAsync(async () => {
        const expectedTokenValue = 'fake-token-value';
        const handleTokenSpy = spyOn(authService, 'handleKeycloakToken');

        spyOn(keycloakService, 'getToken').and.resolveTo(expectedTokenValue);
        await service.initialize();

        keycloakEvents$.next({ type: KeycloakEventType.OnAuthRefreshSuccess });

        tick();

        expect(handleTokenSpy).toHaveBeenCalledOnceWith(expectedTokenValue);
      }));
    });
  });

  describe('isCompatible', () => {
    let url;

    beforeEach(() => {
      url = `${endpointUrl}/api/v1/auth/realms/${environment.authServer.realm}`;
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should add header to suppress error toast', () => {
      service.isCompatible();

      const req = httpMock.expectOne(url);
      expect(req.request.headers.has(NoErrorToastHeader)).toBeTrue();
    });

    it('should return true on 200', () => {
      service.isCompatible().then((result) => {
        expect(result).toEqual(true);
      });

      const req = httpMock.expectOne(url);
      req.flush({}, { status: 200, statusText: 'OK' });
    });

    it('should return false on 404', () => {
      service.isCompatible().then((result) => {
        expect(result).toEqual(false);
      });

      const req = httpMock.expectOne(url);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('login', () => {
    const loginHint = 'test-1234567';
    const locale = 'de-DE';
    const token =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTY1NjQwNzk4NywiZXhwIjoxNjU2NDExNTg3fQ.0Blo63XFPdo6JtYj-0rPP3gu_LZMhT1U4zvBS8JnvHQ';

    let loginSpy: Spy;
    let getTokenSpy: Spy;
    let handleKeycloakTokenSpy: Spy;

    beforeEach(() => {
      loginSpy = spyOn(keycloakService, 'login');
      loginSpy.and.resolveTo(undefined);

      getTokenSpy = spyOn(keycloakService, 'getToken');
      getTokenSpy.and.resolveTo(token);

      handleKeycloakTokenSpy = spyOn(authService, 'handleKeycloakToken');
    });

    it('should login successfully ', async () => {
      await service.login(loginHint, locale);

      expect(loginSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          loginHint,
          locale,
        })
      );

      expect(handleKeycloakTokenSpy).toHaveBeenCalledWith(token);
    });

    it('should throw an error when login failed', async () => {
      keycloakInitSpy.and.rejectWith(undefined);

      try {
        await service.login(loginHint, locale);
      } catch (e) {
        expect(e).toBeInstanceOf(LoginFailedError);
      }
    });

    it('should throw the same error when it is not undefined', async () => {
      const expectedError = { foo: 'bar' };
      keycloakInitSpy.and.rejectWith(expectedError);

      try {
        await service.login(loginHint, locale);
      } catch (e) {
        expect(e).toBe(expectedError);
      }
    });
  });

  describe('openAccountManagement', () => {
    it('should open accountManagement with InAppBrowser', async () => {
      await service.openAccountManagement();

      expect(inAppBrowserCreateSpy).toHaveBeenCalled();
      expect(browserSpy.show).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    let clearTokenSpy: Spy;

    beforeEach(() => {
      clearTokenSpy = spyOn(keycloakService, 'clearToken');
    });

    it('should open logout with InAppBrowser', async () => {
      await service.logout();
      expect(inAppBrowserCreateSpy).toHaveBeenCalled();
      expect(browserSpy.close).toHaveBeenCalled();
      expect(clearTokenSpy).toHaveBeenCalled();
    });

    it('should close browser and reject on error', async () => {
      loadStart.next({ url: 'wrong-url' } as InAppBrowserEvent);
      loadError.next({ url: 'wrong-url' } as InAppBrowserEvent);

      try {
        await service.logout();
        // we want the promise to be rejected
        expect(true).toBeFalse();
      } catch {
        expect(browserSpy.close).toHaveBeenCalled();
        expect(clearTokenSpy).not.toHaveBeenCalled();
      }
    });
  });
});
