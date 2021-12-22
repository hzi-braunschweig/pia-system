/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fetchMocker from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { createSandbox } from 'sinon';

import { HttpClient } from '../core/httpClient';
import { AuthserviceClient } from './authserviceClient';
import { CreateAccountRequestInternalDto } from '../dtos/user';

chai.use(chaiAsPromised);

const testSandbox = createSandbox();

describe('AuthserviceClient', () => {
  const fetchMock = fetchMocker.sandbox();

  let client: AuthserviceClient;

  beforeEach(() => {
    client = new AuthserviceClient('http://authservice:5000');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('createAccount', () => {
    it('should call authservice to create an account', async () => {
      // Arrange
      fetchMock.post(
        {
          url: 'express:/auth/user',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify(null),
        }
      );

      await client.createAccount(createAccount());

      // Assert
      expect(
        fetchMock.called('express:/auth/user', {
          method: 'POST',
          body: createAccount(),
        })
      ).to.be.true;
    });
  });

  describe('deleteAccount', () => {
    it('should call authservice to delete an account', async () => {
      // Arrange
      const username = 'Testuser';
      fetchMock.delete(
        {
          url: 'express:/auth/user/' + username,
        },
        {
          status: StatusCodes.OK,
        }
      );

      await client.deleteAccount(username);

      // Assert
      expect(
        fetchMock.called('express:/auth/user/' + username, {
          method: 'DELETE',
        })
      ).to.be.true;
    });
  });

  function createAccount(): CreateAccountRequestInternalDto {
    return {
      username: 'Testuser',
      password: 'passwort1234',
      role: 'Proband',
      pwChangeNeeded: true,
    };
  }
});
