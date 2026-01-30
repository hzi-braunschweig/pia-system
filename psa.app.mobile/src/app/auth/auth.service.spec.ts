/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { DOCUMENT } from '@angular/common';
import { KeycloakClientService } from './keycloak-client.service';
import { BadgeService } from '../shared/services/badge/badge.service';
import { Platform } from '@ionic/angular';
import createSpyObj = jasmine.createSpyObj;
import { MockProvider } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;
import createSpy = jasmine.createSpy;
import { pl } from 'date-fns/locale';

describe('AuthService', () => {
  let service: AuthService;
  let document;
  let keycloakClient: SpyObj<KeycloakClientService>;
  let badgeService: SpyObj<BadgeService>;
  let platform: SpyObj<Platform>;

  beforeEach(async () => {
    document = {
      defaultView: { location: { href: '/something' } },
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

    platform = createSpyObj('Platform', ['ready', 'is']);
    platform.is.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: document,
        },
        MockProvider(KeycloakClientService, keycloakClient),
        MockProvider(BadgeService, badgeService),
        MockProvider(Platform, platform),
      ],
    });
    service = TestBed.inject(AuthService);
  });

  describe('isAuthenticated()', () => {
    it('should return true when keycloak client is logged in', () => {
      keycloakClient.isLoggedIn.and.returnValue(true);

      const result = service.isAuthenticated();

      expect(result).toBe(true);
      expect(keycloakClient.isLoggedIn).toHaveBeenCalledOnceWith();
    });

    it('should return false when keycloak client is not logged in', () => {
      keycloakClient.isLoggedIn.and.returnValue(false);

      const result = service.isAuthenticated();

      expect(result).toBe(false);
      expect(keycloakClient.isLoggedIn).toHaveBeenCalledOnceWith();
    });
  });

  describe('loginWithUsername()', () => {
    it('should initialize keycloak and call login', fakeAsync(() => {
      platform.is.and.returnValue(true);
      service.loginWithUsername('TEST-0001', 'de-DE');
      tick();

      expect(keycloakClient.initialize).toHaveBeenCalledTimes(1);
      expect(keycloakClient.login).toHaveBeenCalledOnceWith({
        hidden: false,
        username: 'TEST-0001',
        locale: 'de-DE',
      });
    }));
  });

  describe('activateExistingSession()', () => {
    it('should initialize keycloak but not call login when not on native platform', fakeAsync(() => {
      platform.is.and.returnValue(false);
      service.activateExistingSession();
      tick();

      expect(keycloakClient.initialize).toHaveBeenCalledTimes(1);
      expect(keycloakClient.login).not.toHaveBeenCalled();
    }));

    it('should initialize keycloak and login with hidden browser when on native platform', fakeAsync(() => {
      platform.is.and.returnValue(true);
      service.activateExistingSession();
      tick();

      expect(keycloakClient.initialize).toHaveBeenCalledTimes(1);
      expect(keycloakClient.login).toHaveBeenCalledOnceWith({ hidden: true });
    }));
  });

  describe('openAccountManagement()', () => {
    it('should open account management', fakeAsync(() => {
      service.openAccountManagement();
      tick();

      expect(keycloakClient.openAccountManagement).toHaveBeenCalledOnceWith();
    }));
  });

  describe('logout', () => {
    it('should logout', fakeAsync(() => {
      service.logout();
      tick();

      expect(keycloakClient.logout).toHaveBeenCalledOnceWith();
    }));

    it('should clear the badge count', fakeAsync(() => {
      service.logout();
      tick();

      expect(badgeService.clear).toHaveBeenCalledOnceWith();
    }));

    it('should reload the whole app when platform is native', fakeAsync(() => {
      platform.is.and.returnValue(true);
      expect(document.defaultView.location.href).toEqual('/something');

      service.logout();
      tick();

      expect(document.defaultView.location.href).toEqual('/');
    }));

    it('should not reload the app when platform is not native', fakeAsync(() => {
      platform.is.and.returnValue(false);
      expect(document.defaultView.location.href).toEqual('/something');

      service.logout();
      tick();

      expect(document.defaultView.location.href).toEqual('/something');
    }));
  });
});
