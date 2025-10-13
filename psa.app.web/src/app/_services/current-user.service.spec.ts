/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { CurrentUser } from './current-user.service';
import { JwtService } from './jwt.service';
import { MockProvider } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;
import Keycloak from 'keycloak-js';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEventType } from 'keycloak-angular';
import { signal } from '@angular/core';

describe('CurrentUser', () => {
  let currentUser: CurrentUser;

  let keycloak: SpyObj<Keycloak>;
  let jwt: SpyObj<JwtService>;
  let mockSignal: any;

  beforeEach(async () => {
    // Provider and Services
    keycloak = jasmine.createSpyObj([], { token: 'sometoken' });
    jwt = jasmine.createSpyObj(['decodeToken']);
    mockSignal = signal({ type: KeycloakEventType.Ready });
    jwt.decodeToken.and.returnValue(getDecodedToken());

    TestBed.configureTestingModule({
      providers: [
        CurrentUser,
        MockProvider(JwtService, jwt),
        { provide: Keycloak, useValue: keycloak },
        { provide: KEYCLOAK_EVENT_SIGNAL, useValue: mockSignal },
      ],
    });
    currentUser = TestBed.inject(CurrentUser);
  });

  describe('listening to keycloak events', () => {
    it('should initialize the current user', () => {
      // Arrange
      jwt.decodeToken.and.returnValue(getDecodedToken());

      // Act
      mockSignal.set({ type: KeycloakEventType.Ready });
      TestBed.flushEffects();

      // Assert
      expect(currentUser.username).toEqual('Testforscher');
      expect(currentUser.role).toEqual('Forscher');
      expect(currentUser.studies).toEqual(['Teststudie1', 'Teststudie2']);
      expect(currentUser.locale).toEqual('de-DE');
    });

    it('should reset the user on logout', () => {
      // Arrange
      currentUser.username = 'Testforscher';
      currentUser.role = 'Forscher';
      currentUser.studies = ['Teststudie1', 'Teststudie2'];
      currentUser.locale = 'de-DE';

      // Act
      mockSignal.set({ type: KeycloakEventType.AuthLogout });
      TestBed.flushEffects();

      // Assert
      expect(currentUser.username).toBeUndefined();
      expect(currentUser.role).toBeUndefined();
      expect(currentUser.studies).toBeUndefined();
      expect(currentUser.locale).toBeUndefined();
    });

    it('should handle errors', () => {
      // Arrange
      jwt.decodeToken.and.throwError('Token error');

      // Act
      mockSignal.set({ type: KeycloakEventType.Ready });
      TestBed.flushEffects();

      // Assert
      expect(currentUser.username).toBeUndefined();
      expect(currentUser.role).toBeUndefined();
      expect(currentUser.studies).toBeUndefined();
      expect(currentUser.locale).toBeUndefined();
    });
  });

  describe('get study', () => {
    it('should return first study of studies array', () => {
      // Arrange
      currentUser.role = 'Proband';
      currentUser.studies = ['Teststudie1'];

      // Act
      const result = currentUser.study;

      // Assert
      expect(result).toEqual('Teststudie1');
    });

    it('should throw if current user is not a proband', async () => {
      // Arrange
      currentUser.role = 'EinwilligungsManager';
      currentUser.studies = ['Teststudie1', 'Teststudie2'];

      // Act
      const accessFn = () => currentUser.study;

      // Assert
      expect(accessFn).toThrowError(
        'Cannot get single study for professionals'
      );
    });
  });

  describe('isProband()', () => {
    it('should return true', () => {
      // Arrange
      currentUser.role = 'Proband';

      // Act
      const result = currentUser.isProband();

      // Assert
      expect(result).toBeTrue();
    });

    it('should return false', () => {
      // Arrange
      currentUser.role = 'Forscher';

      // Act
      const result = currentUser.isProband();

      // Assert
      expect(result).toBeFalse();
    });
  });

  describe('isProfessional()', () => {
    it('should return true', () => {
      // Arrange
      currentUser.role = 'Untersuchungsteam';

      // Act
      const result = currentUser.isProfessional();

      // Assert
      expect(result).toBeTrue();
    });

    it('should return false', () => {
      // Arrange
      currentUser.role = 'Proband';

      // Act
      const result = currentUser.isProfessional();

      // Assert
      expect(result).toBeFalse();
    });
  });

  describe('hasRole()', () => {
    it('should return true', () => {
      // Arrange
      currentUser.role = 'Untersuchungsteam';

      // Act
      const result = currentUser.hasRole('Untersuchungsteam');

      // Assert
      expect(result).toBeTrue();
    });

    it('should return false', () => {
      // Arrange
      currentUser.role = 'Proband';

      // Act
      const result = currentUser.hasRole('SysAdmin');

      // Assert
      expect(result).toBeFalse();
    });
  });

  function getDecodedToken(): unknown {
    return {
      realm_access: { roles: ['some-unknown-role', 'Forscher'] },
      studies: ['Teststudie1', 'Teststudie2'],
      username: 'Testforscher',
      locale: 'de-DE',
    };
  }
});
