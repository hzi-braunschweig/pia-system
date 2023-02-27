/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Platform } from '@ionic/angular';
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
    platform = jasmine.createSpyObj('Platform', ['ready']);
    platform.ready.and.resolveTo();

    endpoint = jasmine.createSpyObj('EndpointService', ['getUrl']);

    auth = jasmine.createSpyObj('AuthService', ['activateExistingSession']);
    auth.activateExistingSession.and.resolveTo();

    factoryFn = initializeExistingSession(platform, endpoint, auth);
  });

  it('should do nothing if no endpoint is known', async () => {
    // Arrange
    endpoint.getUrl.and.returnValue(null);

    // Act
    await factoryFn();

    // Assert
    expect(auth.activateExistingSession).not.toHaveBeenCalled();
  });

  it('should try to activate an possibly existing session', async () => {
    // Arrange
    endpoint.getUrl.and.returnValue('/some/endpoint');

    // Act
    await factoryFn();

    // Assert
    expect(auth.activateExistingSession).toHaveBeenCalledOnceWith();
  });

  it('should catch any errors from activation', async () => {
    // Arrange
    auth.activateExistingSession.and.rejectWith('some error');

    // Act
    const factoryFnPromise = factoryFn();

    await expectAsync(factoryFnPromise).toBeResolved();
  });
});
