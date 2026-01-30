/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { KeycloakEvent, KeycloakEventType } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import SpyObj = jasmine.SpyObj;

import { KeycloakEventHandlingService } from './keycloak-event-handling.service';
import { KeycloakClientService } from './keycloak-client.service';
import { CurrentUser } from './current-user.service';
import { SideMenuService } from '../shared/services/side-menu/side-menu.service';
import { NotificationService } from '../shared/services/notification/notification.service';

describe('KeycloakEventHandlingService', () => {
  let service: KeycloakEventHandlingService;
  let keycloakClientService: SpyObj<KeycloakClientService>;
  let platform: SpyObj<Platform>;
  let currentUser: SpyObj<CurrentUser>;
  let sideMenuService: SpyObj<SideMenuService>;
  let notificationService: SpyObj<NotificationService>;
  let keycloak: SpyObj<Keycloak>;

  let keycloakSignal = signal<KeycloakEvent>({
    type: KeycloakEventType.AuthSuccess,
  });

  let keycloakWithoutToken = jasmine.createSpyObj(
    'Keycloak',
    ['updateToken', 'logout'],
    {
      token: undefined,
      authenticated: true,
    }
  );

  beforeEach(() => {
    keycloak = jasmine.createSpyObj('Keycloak', ['updateToken', 'logout'], {
      token: 'fake-token-value',
      authenticated: true,
    });
    keycloak.updateToken.and.resolveTo();
    keycloak.logout.and.resolveTo();

    keycloakClientService = jasmine.createSpyObj('KeycloakClientService', [
      'keycloakIsInitialized',
      'keycloakSignal',
      'logout',
    ]);
    keycloakClientService.keycloakIsInitialized.and.returnValue(true);
    keycloakClientService.keycloakSignal.and.returnValue(keycloakSignal());
    keycloakClientService.logout.and.resolveTo();
    Object.defineProperty(keycloakClientService, 'keycloak', {
      value: keycloak,
      writable: true,
    });
    Object.defineProperty(keycloakClientService, 'keycloakReady$', {
      value: { next: jasmine.createSpy('next') },
      writable: true,
    });

    platform = jasmine.createSpyObj('Platform', ['ready', 'is']);
    platform.ready.and.returnValue(Promise.resolve('ready'));
    platform.is.and.returnValue(true);

    currentUser = jasmine.createSpyObj('CurrentUser', ['init', 'reset'], {
      username: 'test-user',
      study: 'test-study',
      locale: 'de-DE',
    });

    sideMenuService = jasmine.createSpyObj('SideMenuService', ['setup']);
    sideMenuService.setup.and.resolveTo();

    notificationService = jasmine.createSpyObj('NotificationService', [
      'onLogout',
      'initPushNotifications',
    ]);
    notificationService.onLogout.and.resolveTo();
    notificationService.initPushNotifications.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        KeycloakEventHandlingService,
        { provide: KeycloakClientService, useValue: keycloakClientService },
        { provide: Platform, useValue: platform },
        { provide: CurrentUser, useValue: currentUser },
        { provide: SideMenuService, useValue: sideMenuService },
        { provide: NotificationService, useValue: notificationService },
      ],
    });

    service = TestBed.inject(KeycloakEventHandlingService);
  });

  describe('Keycloak event handling', () => {
    beforeEach(() => {
      Object.defineProperty(keycloakClientService, 'keycloakSignal', {
        value: () => keycloakSignal(),
        writable: true,
      });

      spyOn(service as any, 'initUser').and.callThrough();
    });

    describe('KeycloakEventType.Ready', () => {
      it('should call initUser method', () => {
        keycloakSignal.set({ type: KeycloakEventType.Ready });
        TestBed.flushEffects();

        expect(service['initUser']).toHaveBeenCalled();
      });
    });

    describe('KeycloakEventType.AuthSuccess', () => {
      it('should call initUser method', () => {
        keycloakSignal.set({ type: KeycloakEventType.AuthSuccess });
        TestBed.flushEffects();

        expect(service['initUser']).toHaveBeenCalled();
      });
    });

    describe('KeycloakEventType.AuthLogout', () => {
      it('should call notification onLogout', () => {
        keycloakSignal.set({ type: KeycloakEventType.AuthLogout });
        TestBed.flushEffects();

        expect(notificationService.onLogout).toHaveBeenCalled();
      });
    });

    describe('KeycloakEventType.TokenExpired', () => {
      it('should refresh token on TokenExpired event', () => {
        keycloakSignal.set({ type: KeycloakEventType.TokenExpired });
        TestBed.flushEffects();

        expect(keycloak.updateToken).toHaveBeenCalledWith(30);
        expect(keycloakClientService.logout).not.toHaveBeenCalled();
      });

      it('should logout if token refresh fails', fakeAsync(() => {
        keycloak.updateToken.and.rejectWith(new Error('refresh failed'));

        keycloakSignal.set({ type: KeycloakEventType.TokenExpired });
        TestBed.flushEffects();
        tick();

        expect(keycloak.updateToken).toHaveBeenCalledWith(30);
        expect(keycloakClientService.logout).toHaveBeenCalled();
      }));
    });

    describe('KeycloakEventType.AuthRefreshError', () => {
      it('should logout on AuthRefreshError event', () => {
        keycloakSignal.set({ type: KeycloakEventType.AuthRefreshError });
        TestBed.flushEffects();

        expect(keycloakClientService.logout).toHaveBeenCalled();
      });
    });

    describe('KeycloakEventType.AuthRefreshSuccess', () => {
      it('should initialize current user on AuthRefreshSuccess event', () => {
        keycloakSignal.set({ type: KeycloakEventType.AuthRefreshSuccess });
        TestBed.flushEffects();

        expect(currentUser.init).toHaveBeenCalledWith('fake-token-value');
      });

      it('should log error if token is undefined after AuthRefreshSuccess', () => {
        Object.defineProperty(keycloakClientService, 'keycloak', {
          value: keycloakWithoutToken,
          writable: true,
        });

        spyOn(console, 'error');

        keycloakSignal.set({ type: KeycloakEventType.AuthRefreshSuccess });
        TestBed.flushEffects();

        expect(console.error).toHaveBeenCalledWith(
          'Keycloak Token is undefined after KeycloakEventType.AuthRefreshSuccess'
        );
        expect(currentUser.init).not.toHaveBeenCalled();
      });
    });

    it('should not process events if keycloak is not initialized', () => {
      keycloakClientService.keycloakIsInitialized.and.returnValue(false);

      keycloakSignal.set({ type: KeycloakEventType.Ready });
      TestBed.flushEffects();

      expect(service['initUser']).not.toHaveBeenCalled();
    });
  });

  describe('initUser', () => {
    it('should initialize the current user when authenticated and token is available', async () => {
      await service['initUser']();

      expect(currentUser.init).toHaveBeenCalledWith('fake-token-value');
    });

    it('should setup the sidemenu when user is authenticated', async () => {
      await service['initUser']();

      expect(sideMenuService.setup).toHaveBeenCalled();
    });

    it('should init push notifications when platform is hybrid and user is authenticated', async () => {
      platform.is.and.returnValue(true);

      await service['initUser']();

      expect(notificationService.initPushNotifications).toHaveBeenCalledWith(
        'test-user'
      );
    });

    it('should not init push notifications when platform is not hybrid', async () => {
      platform.is.and.returnValue(false);

      await service['initUser']();

      expect(notificationService.initPushNotifications).not.toHaveBeenCalled();
    });

    it('should not setup the sidemenu when user is not authenticated', async () => {
      const unauthenticatedKeycloak = jasmine.createSpyObj(
        'Keycloak',
        ['updateToken', 'logout'],
        {
          token: 'fake-token-value',
          authenticated: false,
        }
      );
      Object.defineProperty(keycloakClientService, 'keycloak', {
        value: unauthenticatedKeycloak,
        writable: true,
      });

      await service['initUser']();

      expect(sideMenuService.setup).not.toHaveBeenCalled();
    });

    it('should reset user when not authenticated', async () => {
      const unauthenticatedKeycloak = jasmine.createSpyObj(
        'Keycloak',
        ['updateToken', 'logout'],
        {
          token: 'fake-token-value',
          authenticated: false,
        }
      );
      Object.defineProperty(keycloakClientService, 'keycloak', {
        value: unauthenticatedKeycloak,
        writable: true,
      });

      await service['initUser']();

      expect(currentUser.reset).toHaveBeenCalled();
    });

    it('should reset user when token is undefined', async () => {
      Object.defineProperty(keycloakClientService, 'keycloak', {
        value: keycloakWithoutToken,
        writable: true,
      });

      spyOn(console, 'log');

      await service['initUser']();

      expect(currentUser.reset).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Keycloak token is undefined. Resetting user'
      );
      expect(sideMenuService.setup).not.toHaveBeenCalled();
    });

    it('should set keycloakReady$ to true in finally block', async () => {
      await service['initUser']();

      expect(keycloakClientService.keycloakReady$.next).toHaveBeenCalledWith(
        true
      );
    });

    it('should set keycloakReady$ to true even when an error occurs', async () => {
      sideMenuService.setup.and.rejectWith(new Error('Setup failed'));
      spyOn(console, 'error');

      await service['initUser']();

      expect(console.error).toHaveBeenCalledWith(
        'Error during Keycloak initialization:',
        jasmine.any(Error)
      );
      expect(keycloakClientService.keycloakReady$.next).toHaveBeenCalledWith(
        true
      );
    });

    it('should handle errors and continue execution', async () => {
      currentUser.init.and.throwError('Init failed');
      spyOn(console, 'error');

      await service['initUser']();

      expect(console.error).toHaveBeenCalledWith(
        'Error during Keycloak initialization:',
        jasmine.any(Error)
      );
      expect(keycloakClientService.keycloakReady$.next).toHaveBeenCalledWith(
        true
      );
    });
  });
});
