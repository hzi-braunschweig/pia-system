/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';

import { KeycloakClientService } from './keycloak-client.service';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';
import { environment } from '../../environments/environment';
import { LoginFailedError } from './errors/login-failed-error';
import { TranslateService } from '@ngx-translate/core';
import { MockService } from 'ng-mocks';
import { Platform } from '@ionic/angular';
import { CurrentUser } from './current-user.service';
import Keycloak from 'keycloak-js';
import { PiaKeycloakAdapter } from './keycloak-adapter/keycloak-adapter';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import SpyObj = jasmine.SpyObj;
import { contentTypeInterceptor } from '../shared/interceptors/content-type-interceptor';
import { unauthorizedInterceptor } from '../shared/interceptors/unauthorized-interceptor';
import { httpErrorInterceptor } from '../shared/interceptors/http-error-interceptor.service';
import { KeycloakFactoryService } from './keycloak.factory';
import { KeycloakEvent, KeycloakEventType } from 'keycloak-angular';
import { signal } from '@angular/core';
import { tokenInterceptor } from '../shared/interceptors/token-interceptor';

describe('KeycloakClientService', () => {
  const endpointUrl = 'http://localhost';

  let service: KeycloakClientService;

  let keycloak: SpyObj<Keycloak>;
  let endpoint: EndpointService;
  let currentUser: CurrentUser;
  let mockKeycloakFactory: jasmine.SpyObj<KeycloakFactoryService>;

  beforeEach(() => {
    mockKeycloakFactory = jasmine.createSpyObj('KeycloakFactoryService', [
      'create',
    ]);
    keycloak = jasmine.createSpyObj(
      'Keycloak',
      [
        'updateToken',
        'getToken',
        'init',
        'isTokenExpired',
        'login',
        'accountManagement',
        'logout',
      ],
      {
        token: 'fake-token-value',
        authenticated: true,
      }
    );
    keycloak.logout.and.resolveTo();
    mockKeycloakFactory.create.and.returnValue(keycloak);
    TestBed.configureTestingModule({
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
        {
          provide: KeycloakFactoryService,
          useValue: mockKeycloakFactory,
        },
        provideHttpClient(
          withInterceptors([
            tokenInterceptor,
            contentTypeInterceptor,
            unauthorizedInterceptor,
            httpErrorInterceptor,
          ])
        ),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(KeycloakClientService);
    endpoint = TestBed.inject(EndpointService);
    currentUser = TestBed.inject(CurrentUser);

    endpoint.setCustomEndpoint(endpointUrl);

    environment.authServer.realm = 'dummy-realm';
    environment.authServer.clientId = 'dummy-client';
  });

  describe('initialize', () => {
    it('should initialize keycloak and set the initialization flag', async () => {
      await service.initialize();

      expect(keycloak).toBeDefined();
      expect(keycloak.init).toHaveBeenCalledWith({
        adapter: jasmine.any(PiaKeycloakAdapter),
        pkceMethod: 'S256',
        checkLoginIframe: false,
      });
      expect(service.hasBeenInitialized).toBeTrue();
    });

    it('should not reinitialize if already initialized', async () => {
      service['_hasBeenInitialized'] = true;

      await service.initialize();
      expect(keycloak.init).not.toHaveBeenCalled();
    });
  });

  describe('keycloakSignal effect', () => {
    let keycloakSignal = signal<KeycloakEvent>({
      type: KeycloakEventType.AuthSuccess,
    });

    beforeEach(async () => {
      spyOn(service, 'logout').and.resolveTo();
      spyOn(currentUser, 'init');
      keycloak.token = 'new-token';
      await service.initialize();
      service['keycloakSignal'] = keycloakSignal;
    });

    it('should refresh token on TokenExpired event', () => {
      keycloakSignal.set({ type: KeycloakEventType.TokenExpired });
      TestBed.flushEffects();

      expect(keycloak.updateToken).toHaveBeenCalledWith(30);
      expect(keycloak.logout).not.toHaveBeenCalled();
    });

    it('should logout on AuthRefreshError event', () => {
      keycloakSignal.set({ type: KeycloakEventType.AuthRefreshError });
      TestBed.flushEffects();

      expect(service.logout).toHaveBeenCalled();
      expect(keycloak.updateToken).not.toHaveBeenCalled();
    });

    it('should initialize current user on AuthRefreshSuccess event', () => {
      mockKeycloakFactory.create.and.returnValue(keycloak);
      keycloakSignal.set({ type: KeycloakEventType.AuthRefreshSuccess });
      TestBed.flushEffects();

      expect(currentUser.init).toHaveBeenCalledWith('fake-token-value');
      expect(keycloak.logout).not.toHaveBeenCalled();
      expect(keycloak.updateToken).not.toHaveBeenCalled();
    });
  });

  describe('isLoggedIn', () => {
    it('should return false if not initialized', () => {
      const result = service.isLoggedIn();
      expect(result).toBeFalse();
    });

    it('should return true if authenticated', () => {
      service['keycloak'] = keycloak;
      service['_hasBeenInitialized'] = true;
      keycloak.authenticated = true;
      keycloak.isTokenExpired.and.returnValue(false);

      const result = service.isLoggedIn();
      expect(result).toBeTrue();
    });

    it('should return true if authenticated even if token is expired', () => {
      service['keycloak'] = keycloak;
      service['_hasBeenInitialized'] = true;
      keycloak.authenticated = true;
      keycloak.isTokenExpired.and.returnValue(true);

      const result = service.isLoggedIn();
      expect(result).toBeTrue();
    });
  });

  describe('login', () => {
    const loginHint = 'test-1234567';
    const locale = 'de-DE';

    beforeEach(() => {
      service['keycloak'] = keycloak;
      service['_hasBeenInitialized'] = true;
      keycloak.token = 'fake-token-value';
      keycloak.login.and.resolveTo();
    });

    it('should login successfully and initialize current user', async () => {
      spyOn(currentUser, 'init');

      await service.login(true, loginHint, locale);

      expect(keycloak.login).toHaveBeenCalledWith({
        loginHint,
        locale,
        cordovaOptions: { hidden: 'yes' },
      });
      expect(currentUser.init).toHaveBeenCalledWith('fake-token-value');
    });

    it('should throw LoginFailedError if not initialized', async () => {
      service['_hasBeenInitialized'] = false;

      await expectAsync(
        service.login(false, loginHint, locale)
      ).toBeRejectedWith(jasmine.any(LoginFailedError));
    });

    it('should throw LoginFailedError if login fails', async () => {
      keycloak.login.and.rejectWith(undefined);

      await expectAsync(
        service.login(false, loginHint, locale)
      ).toBeRejectedWith(jasmine.any(LoginFailedError));
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      spyOn(endpoint, 'removeLatestEndpoint');
      spyOn(service, 'initialize').and.callThrough();
    });

    it('should initialize if not already done', async () => {
      service['_hasBeenInitialized'] = false;

      await service.logout();

      expect(service.initialize).toHaveBeenCalled();
    });

    it('should call keycloak logout and remove endpoint', async () => {
      service['keycloak'] = keycloak;
      service['_hasBeenInitialized'] = true;

      await service.logout();

      expect(keycloak.logout).toHaveBeenCalled();
      expect(endpoint.removeLatestEndpoint).toHaveBeenCalled();
    });
  });
});
