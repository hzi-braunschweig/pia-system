/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { KeycloakService } from 'keycloak-angular';
import { initializeAuthentication } from './auth.factory';
import { CurrentUser } from './_services/current-user.service';

describe('initializeAuthentication', () => {
  it('should initialize keycloak with the correct configuration', async () => {
    // Arrange
    const keycloakMock = jasmine.createSpyObj<KeycloakService>(
      'KeycloakService',
      ['init']
    );
    keycloakMock.init.and.resolveTo(true);
    const currentUserMock = jasmine.createSpyObj<CurrentUser>('CurrentUser', [
      'init',
    ]);
    currentUserMock.init.and.resolveTo();
    const initFn = initializeAuthentication(keycloakMock, currentUserMock);

    // Act
    await initFn();

    // Assert
    expect(keycloakMock.init).toHaveBeenCalledOnceWith({
      config: {
        url: `http://localhost/api/v1/auth`,
        realm: 'pia-proband-realm',
        clientId: 'pia-proband-web-app-client',
      },
      initOptions: {
        pkceMethod: 'S256',
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',
      },
    });
    expect(currentUserMock.init).toHaveBeenCalledOnceWith(keycloakMock);
  });
});
