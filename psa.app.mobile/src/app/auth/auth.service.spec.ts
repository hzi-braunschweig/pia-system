/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { createKeycloakToken } from './auth.model.spec';
import { User } from './auth.model';
import { DOCUMENT } from '@angular/common';
import { KeycloakTokenParsed } from 'keycloak-js';
import { InvalidTokenError } from './errors/invalid-token-error';
import { KeycloakClientService } from './keycloak-client.service';
import { BadgeService } from '../shared/services/badge/badge.service';
import createSpyObj = jasmine.createSpyObj;
import { MockProvider } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;
import createSpy = jasmine.createSpy;

describe('AuthService', () => {
  let service: AuthService;
  let document;
  let keycloakClient: SpyObj<KeycloakClientService>;
  let badgeService: BadgeService;

  beforeEach(async () => {
    // Provider and Services
    document = {
      defaultView: { location: { href: '/not/root' } },
    };

    keycloakClient = createSpyObj('KeycloakClientService', [
      'initialize',
      'isLoggedIn',
      'login',
      'logout',
      'openAccountManagement',
    ]);
    keycloakClient.initialize.and.resolveTo();

    badgeService = createSpyObj('BadgeService', ['clear']);

    // Build Base Module
    TestBed.configureTestingModule({
      teardown: { destroyAfterEach: false }, // is needed due to document mock
      providers: [
        {
          provide: DOCUMENT,
          useValue: document,
        },
        MockProvider(KeycloakClientService, keycloakClient),
        MockProvider(BadgeService, badgeService),
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('loginWithUsername()', () => {
    it('should initialize keycloak', fakeAsync(() => {
      service.loginWithUsername('TEST-0001', 'de-DE');
      tick();

      expect(keycloakClient.initialize).toHaveBeenCalledTimes(1);
    }));

    it('should login with hidden in-app browser', fakeAsync(() => {
      service.loginWithUsername('TEST-0001', 'de-DE');
      tick();

      expect(keycloakClient.login).toHaveBeenCalledOnceWith(
        false,
        'TEST-0001',
        'de-DE'
      );
    }));

    it('should emit isAuthenticated event on successful login', fakeAsync(() => {
      keycloakClient.login.and.resolveTo();
      const successSpy = createSpy();
      service.isAuthenticated$.subscribe(successSpy);

      service.loginWithUsername('TEST-0001', 'de-DE');
      tick();

      expect(successSpy).toHaveBeenCalledOnceWith(true);
    }));

    it('should not emit isAuthenticated event on login failure', fakeAsync(() => {
      keycloakClient.login.and.rejectWith('error');
      const successSpy = createSpy();
      service.isAuthenticated$.subscribe(successSpy);

      try {
        service.loginWithUsername('TEST-0001', 'de-DE');
        tick();
        // we want the promise to be rejected
        expect(true).toBeFalse();
      } catch (e) {
        expect(successSpy).not.toHaveBeenCalled();
      }
    }));
  });

  describe('logout', () => {
    it('should logout', fakeAsync(() => {
      service.logout();
      tick();

      expect(keycloakClient.logout).toHaveBeenCalledOnceWith();
    }));

    it('should send isAuthenticated event', fakeAsync(() => {
      const isAuthenticatedSpy = createSpy();
      service.isAuthenticated$.subscribe(isAuthenticatedSpy);

      service.logout();
      tick();

      expect(isAuthenticatedSpy).toHaveBeenCalledOnceWith(false);
    }));

    it('should clear the badge count', fakeAsync(() => {
      service.logout();
      tick();

      expect(badgeService.clear).toHaveBeenCalledOnceWith();
    }));

    it('should reload the whole app', fakeAsync(() => {
      expect(document.defaultView.location.href).toEqual('/not/root');
      service.logout();
      tick();
      expect(document.defaultView.location.href).toEqual('/');
    }));
  });
});
