/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';

import { AppModule } from '../app.module';
import { AuthGuard } from './auth.guard';
import { KeycloakService } from 'keycloak-angular';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import SpyObj = jasmine.SpyObj;

describe('AuthGuard', () => {
  let guard: AuthGuard;

  let keycloak: SpyObj<KeycloakService>;

  beforeEach(async () => {
    keycloak = jasmine.createSpyObj<KeycloakService>('KeycloakService', [
      'login',
      'isLoggedIn',
      'getUserRoles',
    ]);
    keycloak.login.and.resolveTo();

    // Build Base Module
    await MockBuilder(AuthGuard, AppModule).mock(KeycloakService, keycloak);
    guard = TestBed.inject(AuthGuard);
  });

  describe('canActivate()', () => {
    it('should send user to login if not authenticated', async () => {
      // Arrange
      keycloak.isLoggedIn.and.returnValue(false);
      const state = { url: '/some/path' } as RouterStateSnapshot;
      const route = new ActivatedRouteSnapshot();

      // Act
      const result = await guard.canActivate(route, state);

      // Assert
      expect(result).toBeFalse();
      expect(keycloak.login).toHaveBeenCalledTimes(1);
    });

    it('should return true if no roles are expected', async () => {
      // Arrange
      keycloak.isLoggedIn.and.returnValue(true);
      keycloak.getUserRoles.and.returnValue(['Untersuchungsteam']);
      const state = { url: '/some/path' } as RouterStateSnapshot;
      const route = new ActivatedRouteSnapshot();

      // Act
      const result = await guard.canActivate(route, state);

      // Assert
      expect(result).toBeTrue();
    });

    it('should return true if the role matches', async () => {
      // Arrange
      keycloak.isLoggedIn.and.returnValue(true);
      keycloak.getUserRoles.and.returnValue(['Untersuchungsteam']);
      const state = { url: '/some/path' } as RouterStateSnapshot;
      const route = new ActivatedRouteSnapshot();
      route.data = { authorizedRoles: ['Forscher', 'Untersuchungsteam'] };

      // Act
      const result = await guard.canActivate(route, state);

      // Assert
      expect(result).toBeTrue();
    });

    it('should return false if no role matches', async () => {
      // Arrange
      keycloak.isLoggedIn.and.returnValue(true);
      keycloak.getUserRoles.and.returnValue(['Proband']);
      const state = { url: '/some/path' } as RouterStateSnapshot;
      const route = new ActivatedRouteSnapshot();
      route.data = { authorizedRoles: ['Forscher', 'Untersuchungsteam'] };

      // Act
      const result = await guard.canActivate(route, state);

      // Assert
      expect(result).toBeFalse();
    });
  });
});
