/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Platform } from '@ionic/angular';
import { of } from 'rxjs';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { KeycloakClientService } from './keycloak-client.service';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';
import SpyObj = jasmine.SpyObj;

describe('AuthGuard', () => {
  let guard: AuthGuard;

  let auth: SpyObj<AuthService>;
  let router: SpyObj<Router>;
  let keycloakClient: SpyObj<KeycloakClientService>;
  let platform: SpyObj<Platform>;
  let endpoint: SpyObj<EndpointService>;

  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    keycloakClient = jasmine.createSpyObj('KeycloakClientService', ['login']);
    platform = jasmine.createSpyObj('Platform', ['ready', 'is']);
    endpoint = jasmine.createSpyObj('EndpointService', ['getUrl']);

    Object.defineProperty(keycloakClient, 'keycloakReady$', {
      value: of(true),
      writable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: KeycloakClientService, useValue: keycloakClient },
        { provide: Platform, useValue: platform },
        { provide: EndpointService, useValue: endpoint },
      ],
    });
    guard = TestBed.inject(AuthGuard);

    route = {} as ActivatedRouteSnapshot;
    state = { url: '/test-url' } as RouterStateSnapshot;

    endpoint.getUrl.and.returnValue('http://localhost');
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should return true when user is authenticated', async () => {
      auth.isAuthenticated.and.returnValue(true);

      const result = await guard.canActivate(route, state);

      expect(result).toBe(true);
      expect(auth.isAuthenticated).toHaveBeenCalled();
    });

    it('should redirect to login when user is not authenticated on hybrid platform', async () => {
      auth.isAuthenticated.and.returnValue(false);
      platform.is.and.returnValue(true);
      const urlTree = {} as UrlTree;
      router.createUrlTree.and.returnValue(urlTree);

      const result = await guard.canActivate(route, state);

      expect(result).toBe(urlTree);
      expect(auth.isAuthenticated).toHaveBeenCalled();
      expect(platform.is).toHaveBeenCalledWith('hybrid');
      expect(router.createUrlTree).toHaveBeenCalledWith(['auth', 'login']);
    });

    it('should initiate keycloak login when user is not authenticated on web platform', async () => {
      auth.isAuthenticated.and.returnValue(false);
      platform.is.and.returnValue(false);
      keycloakClient.login.and.returnValue(Promise.resolve());

      const result = await guard.canActivate(route, state);

      expect(result).toBe(false);
      expect(auth.isAuthenticated).toHaveBeenCalled();
      expect(platform.is).toHaveBeenCalledWith('hybrid');
      expect(keycloakClient.login).toHaveBeenCalledWith({
        hidden: false,
        redirectUri: jasmine.stringMatching(/test-url$/),
      });
    });

    it('should wait for keycloak to be ready before proceeding', async () => {
      Object.defineProperty(keycloakClient, 'keycloakReady$', {
        value: of(true),
        writable: true,
      });
      auth.isAuthenticated.and.returnValue(true);

      const result = await guard.canActivate(route, state);

      expect(result).toBe(true);
      expect(auth.isAuthenticated).toHaveBeenCalled();
    });

    it('should redirect to login when no endpoint is configured on hybrid platform', async () => {
      platform.is.and.returnValue(true);
      endpoint.getUrl.and.returnValue(null);
      const urlTree = {} as UrlTree;
      router.createUrlTree.and.returnValue(urlTree);

      const result = await guard.canActivate(route, state);

      expect(result).toBe(urlTree);
      expect(platform.is).toHaveBeenCalledWith('hybrid');
      expect(endpoint.getUrl).toHaveBeenCalled();
      expect(router.createUrlTree).toHaveBeenCalledWith(['auth', 'login']);
    });

    it('should proceed normally when endpoint is configured on hybrid platform', async () => {
      platform.is.and.returnValue(true);
      endpoint.getUrl.and.returnValue('http://localhost');
      auth.isAuthenticated.and.returnValue(true);

      const result = await guard.canActivate(route, state);

      expect(result).toBe(true);
      expect(platform.is).toHaveBeenCalledWith('hybrid');
      expect(endpoint.getUrl).toHaveBeenCalled();
      expect(auth.isAuthenticated).toHaveBeenCalled();
    });
  });
});
