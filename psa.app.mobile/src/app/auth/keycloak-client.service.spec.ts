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
import { Platform } from '@ionic/angular/standalone';
import Keycloak from 'keycloak-js';
import { PiaKeycloakAdapter } from './keycloak-adapter/keycloak-adapter';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import SpyObj = jasmine.SpyObj;
import { contentTypeInterceptor } from '../shared/interceptors/content-type-interceptor';
import { unauthorizedInterceptor } from '../shared/interceptors/unauthorized-interceptor';
import { httpErrorInterceptor } from '../shared/interceptors/http-error-interceptor.service';
import { KeycloakFactoryService } from './keycloak.factory';
import { tokenInterceptor } from '../shared/interceptors/token-interceptor';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { CurrentUser } from './current-user.service';

describe('KeycloakClientService', () => {
  const endpointUrl = 'http://localhost';

  let service: KeycloakClientService;

  let keycloak: SpyObj<Keycloak>;
  let endpoint: EndpointService;
  let mockKeycloakFactory: jasmine.SpyObj<KeycloakFactoryService>;
  let platform: jasmine.SpyObj<Platform>;
  let currentUser: jasmine.SpyObj<CurrentUser>;

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
        'createLogoutUrl',
        'createRegisterUrl',
      ],
      {
        token: 'fake-token-value',
        authenticated: true,
      }
    );
    keycloak.logout.and.resolveTo();
    keycloak.createLogoutUrl.and.returnValue('http://logout-url');
    keycloak.updateToken.and.resolveTo();
    mockKeycloakFactory.create.and.returnValue(keycloak);
    platform = jasmine.createSpyObj('Platform', ['ready', 'is']);
    platform.ready.and.returnValue(Promise.resolve('ready'));
    platform.is.and.returnValue(true);

    currentUser = jasmine.createSpyObj('CurrentUser', ['init', 'reset']);

    TestBed.configureTestingModule({
      providers: [
        InAppBrowser,
        {
          provide: TranslateService,
          useValue: MockService(TranslateService),
        },
        {
          provide: Platform,
          useValue: platform,
        },
        {
          provide: KeycloakFactoryService,
          useValue: mockKeycloakFactory,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ study: 'test-study' }),
            },
          },
        },
        {
          provide: CurrentUser,
          useValue: currentUser,
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

    endpoint.setCustomEndpoint(endpointUrl);

    environment.authServer.realm = 'dummy-realm';
    environment.authServer.clientId = 'dummy-client';
  });

  describe('initialize', () => {
    it('should initialize keycloak', async () => {
      await service.initialize();

      expect(keycloak).toBeDefined();
      expect(keycloak.init).toHaveBeenCalledWith({
        adapter: jasmine.any(PiaKeycloakAdapter),
        pkceMethod: 'S256',
        checkLoginIframe: false,
      });
    });

    it('should not reinitialize if already initialized', async () => {
      service['keycloakIsInitialized'].set(true);

      await service.initialize();
      expect(keycloak.init).not.toHaveBeenCalled();
    });
  });

  describe('isLoggedIn', () => {
    it('should return false if not initialized', () => {
      const result = service.isLoggedIn();
      expect(result).toBeFalse();
    });

    it('should return true if authenticated', () => {
      service['keycloak'] = keycloak;
      service['keycloakIsInitialized'].set(true);
      keycloak.authenticated = true;
      keycloak.isTokenExpired.and.returnValue(false);

      const result = service.isLoggedIn();
      expect(result).toBeTrue();
    });

    it('should return true if authenticated even if token is expired', () => {
      service['keycloak'] = keycloak;
      service['keycloakIsInitialized'].set(true);
      keycloak.authenticated = true;
      keycloak.isTokenExpired.and.returnValue(true);

      const result = service.isLoggedIn();
      expect(result).toBeTrue();
    });
  });

  describe('login', () => {
    const loginHint = 'test-1234567';
    const redirectUri = 'http://localhost/redirect';
    const locale = 'de-DE';

    beforeEach(() => {
      service['keycloak'] = keycloak;
      service['keycloakIsInitialized'].set(true);
      keycloak.token = 'fake-token-value';
      keycloak.login.and.resolveTo();
    });

    it('should login successfully', async () => {
      await service.login({
        hidden: true,
        username: loginHint,
        locale,
        redirectUri,
      });

      expect(keycloak.login).toHaveBeenCalledWith({
        loginHint,
        locale,
        cordovaOptions: { hidden: 'yes' },
        redirectUri,
      });
      expect(currentUser.init).toHaveBeenCalledWith('fake-token-value');
    });

    it('should throw LoginFailedError if not initialized', async () => {
      service['keycloakIsInitialized'].set(false);

      await expectAsync(
        service.login({ hidden: false, username: loginHint, locale })
      ).toBeRejectedWith(jasmine.any(LoginFailedError));
    });

    it('should throw LoginFailedError if login fails', async () => {
      keycloak.login.and.rejectWith(undefined);

      await expectAsync(
        service.login({ hidden: false, username: loginHint, locale })
      ).toBeRejectedWith(jasmine.any(LoginFailedError));
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      spyOn(endpoint, 'removeLatestEndpoint');
      spyOn(service, 'initialize').and.callThrough();
    });

    it('should initialize if not already done', async () => {
      service['keycloakIsInitialized'].set(false);

      await service.logout();

      expect(service.initialize).toHaveBeenCalled();
    });

    it('should call keycloak logout and remove endpoint', async () => {
      service['keycloak'] = keycloak;
      service['keycloakIsInitialized'].set(true);

      await service.logout();

      expect(keycloak.logout).toHaveBeenCalled();
      expect(endpoint.removeLatestEndpoint).toHaveBeenCalled();
      expect(currentUser.reset).toHaveBeenCalled();
    });
  });

  describe('createRegisterUrl', () => {
    beforeEach(() => {
      keycloak.createRegisterUrl.and.returnValue(
        'https://keycloak.example.com/register'
      );
      service['keycloak'] = keycloak;
    });

    it('should throw error if keycloak is not initialized', () => {
      service['keycloak'] = undefined;

      expect(() => service.createRegisterUrl('test-study')).toThrowError(
        'Keycloak is not initialized'
      );
    });

    it('should create registration URL with study parameter', () => {
      const result = service.createRegisterUrl('test-study');

      expect(keycloak.createRegisterUrl).toHaveBeenCalledWith({
        redirectUri: environment.baseUrl,
      });
      expect(result).toContain('https://keycloak.example.com/register');
      expect(result).toContain('study=test-study');
    });
  });

  describe('openAccountManagement', () => {
    beforeEach(() => {
      service['keycloak'] = keycloak;
      service['keycloakIsInitialized'].set(true);
      keycloak.accountManagement.and.resolveTo();
    });

    it('should call keycloak accountManagement', async () => {
      await service.openAccountManagement();

      expect(keycloak.accountManagement).toHaveBeenCalled();
    });
  });
});
