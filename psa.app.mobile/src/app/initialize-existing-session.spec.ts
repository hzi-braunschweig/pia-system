/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Platform } from '@ionic/angular/standalone';
import { AuthService } from './auth/auth.service';
import { EndpointService } from './shared/services/endpoint/endpoint.service';
import { initializeExistingSession } from './initialize-existing-session';
import SpyObj = jasmine.SpyObj;

describe('initializeExistingSession', () => {
  let platform: SpyObj<Platform>;
  let endpoint: SpyObj<EndpointService>;
  let auth: SpyObj<AuthService>;

  let factoryFn: () => Promise<void>;

  beforeEach(() => {
    platform = jasmine.createSpyObj('Platform', ['ready', 'is']);
    platform.is.and.returnValue(false);

    endpoint = jasmine.createSpyObj('EndpointService', ['getUrl']);

    auth = jasmine.createSpyObj('AuthService', ['activateExistingSession']);
    auth.activateExistingSession.and.resolveTo();

    factoryFn = initializeExistingSession(platform, endpoint, auth);
  });

  it('should do nothing if native platform and no endpoint is known', async () => {
    // Arrange
    platform.is.and.returnValue(true);
    endpoint.getUrl.and.returnValue(null);

    // Act
    await factoryFn();

    // Assert
    expect(auth.activateExistingSession).not.toHaveBeenCalled();
  });

  it('should try to activate session on web platform even without endpoint', async () => {
    // Arrange
    platform.is.and.returnValue(false);
    endpoint.getUrl.and.returnValue(null);

    // Act
    await factoryFn();

    // Assert
    expect(auth.activateExistingSession).toHaveBeenCalledOnceWith();
  });

  it('should try to activate session on native platform with endpoint', async () => {
    // Arrange
    platform.is.and.returnValue(true);
    endpoint.getUrl.and.returnValue('/some/endpoint');

    // Act
    await factoryFn();

    // Assert
    expect(auth.activateExistingSession).toHaveBeenCalledOnceWith();
  });

  it('should try to activate session on web platform with endpoint', async () => {
    // Arrange
    platform.is.and.returnValue(false);
    endpoint.getUrl.and.returnValue('/some/endpoint');

    // Act
    await factoryFn();

    // Assert
    expect(auth.activateExistingSession).toHaveBeenCalledOnceWith();
  });

  it('should catch any errors from activation', async () => {
    // Arrange
    platform.is.and.returnValue(false); // web platform
    auth.activateExistingSession.and.rejectWith('some error');

    // Act
    const factoryFnPromise = factoryFn();

    // Assert
    await expectAsync(factoryFnPromise).toBeResolved();
  });
});
