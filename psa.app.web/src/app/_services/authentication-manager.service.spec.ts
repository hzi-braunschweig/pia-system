/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { KeycloakService } from 'keycloak-angular';
import { MockProvider } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;

import { AuthenticationManager } from './authentication-manager.service';
import { FCMService } from './fcm.service';

describe('AuthenticationManager', () => {
  let service: AuthenticationManager;

  let keycloak: SpyObj<KeycloakService>;
  let fcmService: SpyObj<FCMService>;

  beforeEach(async () => {
    // Provider and Services
    keycloak = jasmine.createSpyObj(['logout']);
    keycloak.logout.and.resolveTo();

    fcmService = jasmine.createSpyObj(['onLogout']);
    fcmService.onLogout.and.resolveTo(true);

    // Build Base Module
    TestBed.configureTestingModule({
      providers: [
        AuthenticationManager,
        MockProvider(KeycloakService, keycloak),
        MockProvider(FCMService, fcmService),
      ],
    });
    service = TestBed.inject(AuthenticationManager);
  });

  describe('logout()', () => {
    it('should call fcmService', async () => {
      // Act
      await service.logout();

      // Assert
      expect(fcmService.onLogout).toHaveBeenCalledTimes(1);
    });

    it('should call keycloak logout', async () => {
      // Act
      await service.logout();

      // Assert
      expect(keycloak.logout).toHaveBeenCalledTimes(1);
    });
  });
});
