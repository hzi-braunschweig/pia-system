/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { KeycloakService } from 'keycloak-angular';
import { CurrentUser } from './current-user.service';
import { JwtService } from './jwt.service';
import { MockProvider } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;

describe('CurrentUser', () => {
  let currentUser: CurrentUser;

  let keycloak: SpyObj<KeycloakService>;
  let jwt: SpyObj<JwtService>;

  beforeEach(async () => {
    // Provider and Services
    keycloak = jasmine.createSpyObj(['getToken']);
    keycloak.getToken.and.resolveTo('sometoken');
    jwt = jasmine.createSpyObj(['decodeToken']);

    // Build Base Module
    TestBed.configureTestingModule({
      providers: [CurrentUser, MockProvider(JwtService, jwt)],
    });
    currentUser = TestBed.inject(CurrentUser);
  });

  describe('init()', () => {
    it('should initialize the current user', async () => {
      // Arrange
      jwt.decodeToken.and.returnValue(getDecodedToken());

      // Act
      const successful = await currentUser.init(keycloak);

      // Assert
      expect(successful).toBeTrue();
      expect(currentUser.username).toEqual('Testforscher');
      expect(currentUser.role).toEqual('Forscher');
      expect(currentUser.studies).toEqual(['Teststudie1', 'Teststudie2']);
      expect(currentUser.locale).toEqual('de-DE');
    });

    it('should handle errors', async () => {
      // Arrange
      keycloak.getToken.and.rejectWith();

      // Act
      const successful = await currentUser.init(keycloak);

      // Assert
      expect(successful).toBeFalse();
    });
  });

  describe('get study', () => {
    it('should return first study of studies array', async () => {
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
      realm_access: { roles: ['Forscher', 'default-roles-public-realm'] },
      studies: ['Teststudie1', 'Teststudie2'],
      username: 'Testforscher',
      locale: 'de-DE',
    };
  }
});
