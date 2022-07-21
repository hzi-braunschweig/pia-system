/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import nock, { Interceptor, Scope } from 'nock';
import { StatusCodes } from 'http-status-codes';

/**
 * Intercepts NodeJS http requests to the token introspection endpoint with nock
 *
 * Does not return any real token payload as this is simply ignored by hapi-auth-keycloak.
 * It only evaluates, whether the token is still active.
 *
 * IMPORTANT:
 * Please note that nock will remove a request interceptor as soon as it was called.
 * This means, if it will NOT be called within a test case, it will stay alive and
 * may influence the results of your next tests.
 *
 * There are two options to handle this:
 *
 * 1. Assert that the interceptor has been called (recommended)
 * @example
 * // Arrange
 * const authRequest = AuthServerMock.adminRealm().returnValid();
 * // Act
 * ...
 * // Assert
 * authRequest.done();
 *
 * 2. Clean up all nock interceptors after each test case
 * @example
 * afterEach(() => AuthServerMock.cleanAll());
 *
 * For more examples
 * @see tests/integration/auth.spec.ts
 */
export class AuthServerMock {
  private readonly instance: Interceptor = nock('http://authserver:5000').post(
    `/realms/${this.realmName}/protocol/openid-connect/token/introspect`
  );

  private constructor(private readonly realmName: string) {}

  public static probandRealm(this: void): AuthServerMock {
    return new AuthServerMock('pia-proband-realm');
  }

  public static adminRealm(this: void): AuthServerMock {
    return new AuthServerMock('pia-admin-realm');
  }

  public static cleanAll(this: void): void {
    nock.cleanAll();
  }

  public returnError(message?: string): Scope {
    return this.instance.replyWithError(message ?? 'AuthServerMock error');
  }

  public returnInvalid(): Scope {
    return this.instance.reply(StatusCodes.OK, { active: false });
  }

  public returnValid(): Scope {
    return this.instance.reply(StatusCodes.OK, { active: true });
  }
}
