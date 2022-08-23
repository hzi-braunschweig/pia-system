/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Platform } from '@ionic/angular';
import { AuthService } from './auth/auth.service';
import { KeycloakClientService } from './auth/keycloak-client.service';
import { EndpointService } from './shared/services/endpoint/endpoint.service';
import { LocaleService } from './shared/services/locale/locale.service';
import SpyObj = jasmine.SpyObj;
import { initializeActiveSession } from './initialize-active-session';

describe('initializeActiveSession', () => {
  let platform: SpyObj<Platform>;
  let auth: SpyObj<AuthService>;
  let keycloakClient: SpyObj<KeycloakClientService>;
  let endpoint: SpyObj<EndpointService>;
  let localeService: SpyObj<LocaleService>;

  let factoryFn: () => Promise<void>;

  beforeEach(() => {
    platform = jasmine.createSpyObj('Platform', ['ready']);
    platform.ready.and.resolveTo();

    auth = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    auth.getCurrentUser.and.returnValue({
      username: 'Testproband',
      role: 'Proband',
      study: 'Teststudy',
    });

    keycloakClient = jasmine.createSpyObj('KeycloakClientService', [
      'isCompatible',
      'login',
    ]);
    keycloakClient.isCompatible.and.resolveTo(true);
    keycloakClient.login.and.resolveTo();

    endpoint = jasmine.createSpyObj('EndpointService', ['setEndpointForUser']);

    localeService = jasmine.createSpyObj('LocaleService', [], {
      currentLocale: 'de-DE',
    });

    factoryFn = initializeActiveSession(
      platform,
      auth,
      keycloakClient,
      endpoint,
      localeService
    );
  });

  it('should set the endpoint for the user if username can be read from token', async () => {
    // Arrange

    // Act
    await factoryFn();

    // Assert
    expect(endpoint.setEndpointForUser).toHaveBeenCalledOnceWith('Testproband');
  });

  it('should login the current user if username can be read from token', async () => {
    // Arrange

    // Act
    await factoryFn();

    // Assert
    expect(keycloakClient.login).toHaveBeenCalledOnceWith(
      'Testproband',
      'de-DE',
      false
    );
  });

  it('should not do anything if no token exists', async () => {
    // Arrange
    auth.getCurrentUser.and.returnValue(null);

    // Act
    await factoryFn();

    // Assert
    expect(endpoint.setEndpointForUser).not.toHaveBeenCalled();
    expect(keycloakClient.login).not.toHaveBeenCalled();
  });

  it('should not login the user if a legacy backend is detected', async () => {
    // Arrange
    keycloakClient.isCompatible.and.resolveTo(false);

    // Act
    await factoryFn();

    // Assert
    expect(endpoint.setEndpointForUser).toHaveBeenCalledOnceWith('Testproband');
    expect(keycloakClient.login).not.toHaveBeenCalled();
  });
});
