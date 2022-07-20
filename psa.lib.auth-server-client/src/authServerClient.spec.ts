/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { AuthServerClient, AuthServerClientSettings } from './authServerClient';
import nock, { Scope } from 'nock';
import { createSandbox, SinonFakeTimers } from 'sinon';
import { once } from 'events';
import * as http from 'http';
import { expect } from 'chai';

const MILLI_PER_SECOND = 1000;

describe('AuthClient', () => {
  const testConnection = { url: 'http://test:1' };
  const realmName = 'pia-test-realm';
  const now = Math.floor(Date.now() / MILLI_PER_SECOND);
  const tokenLifespan = 300; // seconds
  const accessToken =
    '.' +
    Buffer.from(
      JSON.stringify({ exp: now + tokenLifespan, iat: now })
    ).toString('base64') +
    '.';
  const sandbox = createSandbox();
  let clock: SinonFakeTimers;
  let uut: AuthServerClient;

  beforeEach(() => {
    nock.emitter.on('no match', (req: http.ClientRequest) => {
      expect(req.method + ' ' + req.path).to.equal('');
    });
    const clientSettings: AuthServerClientSettings = {
      connection: testConnection,
      clientId: 'test-client-id',
      secret: 'test-client-secret',
      realm: 'pia-test-realm',
    };
    uut = new AuthServerClient(clientSettings, MILLI_PER_SECOND);

    clock = sandbox.useFakeTimers();
  });

  afterEach(() => {
    uut.disconnect();
    sandbox.restore();
    nock.cleanAll();
  });

  it('should connect', async () => {
    // Arrange
    const scope = createSuccessLoginScope();

    // Act
    uut.connect();

    // Assert
    await once(uut.connectionEvents, 'connected');
    scope.done();
  });

  it('should connect and wait for the server to be available', async () => {
    // Arrange
    const scope = createSuccessLoginScope()
      .get(`/admin/realms/${realmName}`)
      .reply(200);

    // Act
    await uut.waitForServer();

    // Assert
    scope.done();
  });

  it('should only connect once but check realm as often as called', async () => {
    // Arrange
    const scope = createSuccessLoginScope()
      .get(`/admin/realms/${realmName}`)
      .times(3)
      .reply(200);

    // Act
    await Promise.all([
      uut.waitForServer(),
      uut.waitForServer(),
      uut.waitForServer(),
    ]);

    // Assert
    scope.done();
  });

  describe('connected', () => {
    beforeEach(async () => {
      createSuccessLoginScope();
      uut.connect();
      await once(uut.connectionEvents, 'connected');
    });

    it('should renew the token before it is expired', async () => {
      // Arrange
      const scope = createSuccessLoginScope();

      // Act
      clock.tick((tokenLifespan - 2) * MILLI_PER_SECOND);
      await once(scope, 'replied');

      // Assert
      scope.done();
    });

    it('should emit connection lost if renewing fails', async () => {
      // Arrange
      const scope = createFailLoginScope();
      const promiseConnectionLost = once(
        uut.connectionEvents,
        'connection_lost'
      );

      // Act
      clock.tick((tokenLifespan - 2) * MILLI_PER_SECOND);
      await once(scope, 'replied');

      // Assert
      scope.done();
      await promiseConnectionLost;
    });
  });

  describe('with lost connection', () => {
    beforeEach(async () => {
      createFailLoginScope();
      uut.connect();
      await once(uut.connectionEvents, 'connection_lost');
    });
    it('should frequently try to reconnect', async () => {
      // Arrange
      const scope1 = createFailLoginScope();

      // Act
      clock.tick(MILLI_PER_SECOND + 5);
      await once(scope1, 'replied');

      // Assert
      scope1.done();

      // Arrange
      const scope2 = createSuccessLoginScope();

      // Act
      clock.tick(MILLI_PER_SECOND);
      await once(scope2, 'replied');

      // Assert
      scope2.done();
    });
  });

  function createSuccessLoginScope(): Scope {
    return nock(testConnection.url)
      .post(`/realms/${realmName}/protocol/openid-connect/token`)
      .reply(200, { accessToken });
  }

  function createFailLoginScope(): Scope {
    return nock(testConnection.url)
      .post(`/realms/${realmName}/protocol/openid-connect/token`)
      .reply(503);
  }
});
