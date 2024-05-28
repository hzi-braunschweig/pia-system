/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi from '@hapi/hapi';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { AuthClientSettings, HttpConnection } from '../config/configModel';
import { PublicApiAuthenticator } from './publicApiAuthenticator';
import { AuthServerMock } from '../test/authServerMock';
import { AuthTokenMockBuilder } from '../test/authTokenMockBuilder';

chai.use(chaiAsPromised);

describe('PublicApiAuthenticator', () => {
  beforeEach(() => AuthServerMock.adminRealm().returnValid());
  afterEach(() => AuthServerMock.cleanAll());

  it('should throw if given security name is unequal to the configured one', async () => {
    await expect(
      PublicApiAuthenticator.authenticate(
        'someOtherSecurityName',
        createRequest(),
        createAuthClientSettings()
      )
    ).to.be.rejectedWith('Unknown security configuration');
  });

  it('should throw if no token was found', async () => {
    const request = createRequest({
      headers: {},
    });

    await expect(
      PublicApiAuthenticator.authenticate(
        'jwt-public',
        request,
        createAuthClientSettings()
      )
    ).to.be.rejectedWith('No or invalid authorization token provided');
  });

  it('should throw if token cannot be decoded', async () => {
    const request = createRequest({
      headers: {
        authorization: 'Bearer invalidToken',
      },
    });

    await expect(
      PublicApiAuthenticator.authenticate(
        'jwt-public',
        request,
        createAuthClientSettings()
      )
    ).to.be.rejectedWith('No or invalid authorization token provided');
  });

  it('should throw if token is invalid', () => {
    AuthServerMock.cleanAll();
    AuthServerMock.adminRealm().returnInvalid();

    return expect(
      PublicApiAuthenticator.authenticate(
        'jwt-public',
        createRequest(),
        createAuthClientSettings()
      )
    ).to.be.rejectedWith('No or invalid authorization token provided');
  });

  it('should throw if study access is missing', async () => {
    const request = createRequest({
      params: {
        studyName: 'SomeOtherStudy',
      },
    });

    await expect(
      PublicApiAuthenticator.authenticate(
        'jwt-public',
        request,
        createAuthClientSettings()
      )
    ).to.be.rejectedWith(
      'Requesting user has no access to study "SomeOtherStudy"'
    );
  });

  it('should not throw if study name is not part of the url', async () => {
    const request = createRequest({
      params: {
        questionnaireId: '1234',
      },
    });

    await expect(
      PublicApiAuthenticator.authenticate(
        'jwt-public',
        request,
        createAuthClientSettings()
      )
    ).not.to.be.rejected;
  });

  it('should return the decoded token', async () => {
    const decodedToken = await PublicApiAuthenticator.authenticate(
      'jwt-public',
      createRequest(),
      createAuthClientSettings()
    );

    expect(decodedToken).to.be.deep.equal(
      AuthTokenMockBuilder.createTokenPayload({
        username: 'public-api-client-user',
        roles: [],
        studies: ['Teststudy'],
      })
    );
  });

  function createRequest(overwrites: Partial<Hapi.Request> = {}): Hapi.Request {
    return {
      headers: {
        Authorization: AuthTokenMockBuilder.createToken({
          username: 'public-api-client-user',
          roles: [],
          studies: ['Teststudy'],
        }),
      },
      params: {
        studyName: 'Teststudy',
      },
      ...overwrites,
    } as unknown as Hapi.Request;
  }

  function createAuthClientSettings(): AuthClientSettings {
    const authPort = 5000;
    return {
      connection: new HttpConnection('authserver', authPort),
      realm: 'pia-admin-realm',
      clientId: 'someClientId',
      secret: 'someSecret',
    };
  }
});
