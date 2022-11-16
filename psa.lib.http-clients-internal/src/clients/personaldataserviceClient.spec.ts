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
import { PersonaldataserviceClient } from './personaldataserviceClient';
import { PersonalDataInternalDto } from '../dtos/personalData';

chai.use(chaiAsPromised);

const testSandbox = createSandbox();

describe('PersonaldataserviceClient', () => {
  const fetchMock = fetchMocker.sandbox();

  let client: PersonaldataserviceClient;

  beforeEach(() => {
    client = new PersonaldataserviceClient('http://personaldataservice:5000');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('updatePersonalData', () => {
    it('should call personaldataservice to update personal data of a proband', async () => {
      // Arrange
      const pseudonym = 'TEST-1234';
      fetchMock.put(
        {
          url: 'express:/personal/personalData/proband/' + pseudonym,
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify(null),
        }
      );

      await client.updatePersonalData(pseudonym, createPersonalData());

      // Assert
      expect(
        fetchMock.called(
          'express:/personal/personalData/proband/' + pseudonym,
          {
            method: 'PUT',
            body: createPersonalData(),
          }
        )
      ).to.be.true;
    });

    it('should add "skipUpdateAccount" query param', async () => {
      // Arrange
      const pseudonym = 'TEST-1234';
      fetchMock.put(
        {
          url: 'express:/personal/personalData/proband/' + pseudonym,
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify(null),
        }
      );

      await client.updatePersonalData(pseudonym, createPersonalData(), true);

      // Assert
      expect(
        fetchMock.called(
          'express:/personal/personalData/proband/' + pseudonym,
          {
            method: 'PUT',
            query: {
              skipUpdateAccount: 'true',
            },
            body: createPersonalData(),
          }
        )
      ).to.be.true;
    });
  });

  describe('getPersonalDataEmail', () => {
    it('should call personaldataservice to get a probands email', async () => {
      // Arrange
      const pseudonym = 'Testuser';
      fetchMock.get(
        {
          url: 'express:/personal/personalData/proband/Testuser/email',
        },
        {
          status: StatusCodes.OK,
          body: 'lisa.ludwig@example.com',
        }
      );

      const result = await client.getPersonalDataEmail(pseudonym);

      // Assert
      expect(
        fetchMock.called(
          'express:/personal/personalData/proband/Testuser/email',
          {
            method: 'GET',
          }
        )
      ).to.be.true;
      expect(result).to.eql('lisa.ludwig@example.com');
    });
  });

  describe('deletePersonalDataOfUser', () => {
    it('should call personaldataservice to delete a probands personal data', async () => {
      // Arrange
      const pseudonym = 'Testuser';
      fetchMock.delete(
        {
          url: 'express:/personal/personalData/proband/' + pseudonym,
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify(null),
        }
      );

      await client.deletePersonalDataOfUser(pseudonym);

      // Assert
      expect(
        fetchMock.called(
          'express:/personal/personalData/proband/' + pseudonym,
          {
            method: 'DELETE',
          }
        )
      ).to.be.true;
    });
  });

  function createPersonalData(): PersonalDataInternalDto {
    return {
      name: 'Ludwig',
      vorname: 'Lisa',
      email: 'lisa.ludwig@example.com',
    };
  }
});
