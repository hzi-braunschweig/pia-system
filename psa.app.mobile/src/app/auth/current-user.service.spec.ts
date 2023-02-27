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
      await currentUser.init('some.jwt.token');

      // Assert
      expect(currentUser.username).toEqual('TEST-1234');
      expect(currentUser.study).toEqual('Teststudie1');
      expect(currentUser.locale).toEqual('de-DE');
    });
  });

  describe('get study', () => {
    it('should return first study of studies array', async () => {
      // Arrange
      jwt.decodeToken.and.returnValue(getDecodedToken());
      currentUser.init('some.jwt.token');

      // Act
      const result = currentUser.study;

      // Assert
      expect(result).toEqual('Teststudie1');
    });
  });

  function getDecodedToken(): unknown {
    return {
      studies: ['Teststudie1', 'Teststudie2'],
      username: 'TEST-1234',
      locale: 'de-DE',
    };
  }
});
