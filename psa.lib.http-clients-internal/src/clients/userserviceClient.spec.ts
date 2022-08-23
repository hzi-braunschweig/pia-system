/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { StatusCodes } from 'http-status-codes';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { createSandbox } from 'sinon';
import fetchMocker from 'fetch-mock';

import { HttpClient } from '../core/httpClient';
import { UserserviceClient } from './userserviceClient';
import {
  AccountStatus,
  ProbandInternalDto,
  ProbandRequestInternalDto,
  ProbandStatus,
} from '../dtos/proband';

chai.use(chaiAsPromised);

const testSandbox = createSandbox();

describe('UserserviceClient', () => {
  const fetchMock = fetchMocker.sandbox();

  let userserviceClient: UserserviceClient;

  beforeEach(() => {
    userserviceClient = new UserserviceClient('http://userservice:5000');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('getPseudonyms', () => {
    it('should call userservice to get a list of pseudonyms', async () => {
      // Arrange
      fetchMock.get(
        { url: 'express:/user/pseudonyms' },
        { status: StatusCodes.OK, body: JSON.stringify(['TEST-1', 'TEST-2']) }
      );

      // Act
      const result = await userserviceClient.getPseudonyms();

      // Assert
      expect(
        fetchMock.called('express:/user/pseudonyms', {
          method: 'GET',
        })
      ).to.be.true;
      expect(result).to.eql(['TEST-1', 'TEST-2']);
    });

    it('should call userservice with status filter query param', async () => {
      // Arrange
      fetchMock.get(
        { url: 'express:/user/pseudonyms' },
        { status: StatusCodes.OK, body: JSON.stringify(['TEST-1', 'TEST-2']) }
      );

      // Act
      const result = await userserviceClient.getPseudonyms({
        probandStatus: ProbandStatus.ACTIVE,
      });

      // Assert
      expect(
        fetchMock.called('express:/user/pseudonyms', {
          method: 'GET',
          query: {
            status: 'active',
          },
        })
      ).to.be.true;
      expect(result).to.eql(['TEST-1', 'TEST-2']);
    });

    it('should call userservice with multiple filter query params', async () => {
      // Arrange
      fetchMock.get(
        { url: 'express:/user/pseudonyms' },
        { status: StatusCodes.OK, body: JSON.stringify(['TEST-1', 'TEST-2']) }
      );

      // Act
      const result = await userserviceClient.getPseudonyms({
        study: 'Teststudy',
        complianceContact: true,
        probandStatus: [ProbandStatus.ACTIVE, ProbandStatus.DEACTIVATED],
      });

      // Assert
      expect(
        fetchMock.called('express:/user/pseudonyms', {
          method: 'GET',
          query: {
            study: 'Teststudy',
            complianceContact: 'true',
            status: ['active', 'deactivated'],
          },
        })
      ).to.be.true;
      expect(result).to.eql(['TEST-1', 'TEST-2']);
    });
  });

  describe('getExternalIds', () => {
    it('should call userservice with multiple filter query params', async () => {
      // Arrange
      fetchMock.get(
        { url: 'express:/user/externalIds' },
        {
          status: StatusCodes.OK,
          body: JSON.stringify([
            { pseudonym: 'test-1', externalId: 'TEST-1' },
            { pseudonym: 'test-2', externalId: 'TEST-2' },
          ]),
        }
      );

      // Act
      const result = await userserviceClient.getExternalIds({
        study: 'Teststudy',
        complianceContact: true,
      });

      // Assert
      expect(
        fetchMock.called('express:/user/externalIds', {
          method: 'GET',
          query: {
            study: 'Teststudy',
            complianceContact: 'true',
          },
        })
      ).to.be.true;
      expect(result).to.deep.equal([
        { pseudonym: 'test-1', externalId: 'TEST-1' },
        { pseudonym: 'test-2', externalId: 'TEST-2' },
      ]);
    });
  });

  describe('lookupIds', () => {
    it('should call userservice to lookup an ids', async () => {
      // Arrange
      fetchMock.get(
        {
          url: 'express:/user/users/:pseudonym/ids',
        },
        {
          status: StatusCodes.OK,
          body: 'TEST-IDS',
        }
      );

      // Act
      const result = await userserviceClient.lookupIds('TEST-pseudonym');

      // Assert
      expect(
        fetchMock.called('express:/user/users/TEST-pseudonym/ids', {
          method: 'GET',
        })
      ).to.be.true;
      expect(result).to.eql('TEST-IDS');
    });
  });

  describe('lookupMappingId', () => {
    it('should call userservice to lookup a mappingId', async () => {
      // Arrange
      fetchMock.get(
        {
          url: 'express:/user/users/:pseudonym/mappingId',
        },
        {
          status: StatusCodes.OK,
          body: 'TEST-mappingId',
        }
      );

      // Act
      const result = await userserviceClient.lookupMappingId('DAS-pseudonym');

      // Assert
      expect(
        fetchMock.called('express:/user/users/DAS-pseudonym/mappingId', {
          method: 'GET',
        })
      ).to.be.true;
      expect(result).to.eql('TEST-mappingId');
    });
  });

  describe('retrieveUserExternalCompliance', () => {
    it('should call userservice to get the external compliances of a proband', async () => {
      // Arrange
      fetchMock.get(
        {
          url: 'express:/user/users/:pseudonym/externalcompliance',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify({
            complianceLabresults: true,
            complianceSamples: false,
            complianceBloodsamples: false,
            complianceContact: true,
          }),
        }
      );

      // Act
      const result = await userserviceClient.retrieveUserExternalCompliance(
        'TEST-4321'
      );

      // Assert
      expect(
        fetchMock.called('express:/user/users/TEST-4321/externalcompliance', {
          method: 'GET',
        })
      ).to.be.true;
      expect(result).to.eql({
        complianceLabresults: true,
        complianceSamples: false,
        complianceBloodsamples: false,
        complianceContact: true,
      });
    });
  });

  describe('getProbandsWithAccessToFromProfessional', () => {
    it('should call userservice to get all probands a professional has access to', async () => {
      // Arrange
      fetchMock.get(
        {
          url: 'express:/user/professional/:username/allProbands',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify(['TEST-1', 'TEST-2', 'TEST-3']),
        }
      );

      // Act
      const result =
        await userserviceClient.getProbandsWithAccessToFromProfessional(
          'forscher@example.com'
        );

      // Assert
      expect(
        fetchMock.called(
          'express:/user/professional/forscher@example.com/allProbands',
          {
            method: 'GET',
          }
        )
      ).to.be.true;
      expect(result).to.eql(['TEST-1', 'TEST-2', 'TEST-3']);
    });
  });

  describe('getProband', () => {
    it('should call userservice to get a proband by pseudonym', async () => {
      // Arrange
      const expected: ProbandInternalDto = createProband();
      fetchMock.get(
        {
          url: 'express:/user/users/:pseudonym',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify(expected),
        }
      );

      // Act
      const result = await userserviceClient.getProband('TEST-1234');

      // Assert
      expect(
        fetchMock.called('express:/user/users/TEST-1234', {
          method: 'GET',
        })
      ).to.be.true;
      expect(result).to.eql(expected);
    });
  });

  describe('isProbandExistentByUsername', () => {
    it('should call userservice and return true when proband with pseudonym exists', async () => {
      // Arrange
      fetchMock.get(
        {
          url: 'express:/user/users/:pseudonym',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify({
            pseudonym: 'TEST-1234',
            role: 'Proband',
          }),
        }
      );

      // Act
      const result = await userserviceClient.isProbandExistentByUsername(
        'TEST-1234'
      );

      // Assert
      expect(
        fetchMock.called('express:/user/users/TEST-1234', {
          method: 'GET',
        })
      ).to.be.true;
      expect(result).to.be.true;
    });

    it('should call userservice and return false when proband with pseudonym does not exist', async () => {
      // Arrange
      fetchMock.get(
        {
          url: 'express:/user/users/:pseudonym',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify(null),
        }
      );

      // Act
      const result = await userserviceClient.isProbandExistentByUsername(
        'TEST-1234'
      );

      // Assert
      expect(
        fetchMock.called('express:/user/users/TEST-1234', {
          method: 'GET',
        })
      ).to.be.true;
      expect(result).to.be.false;
    });
  });

  describe('getStudyOfProband', () => {
    it('should call userservice to get the study of the proband', async () => {
      // Arrange
      fetchMock.get(
        {
          url: 'express:/user/users/:pseudonym',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify({
            pseudonym: 'TEST-1234',
            role: 'Proband',
            study: 'Teststudy',
          }),
        }
      );

      // Act
      const result = await userserviceClient.getStudyOfProband('TEST-1234');

      // Assert
      expect(
        fetchMock.called('express:/user/users/TEST-1234', {
          method: 'GET',
        })
      ).to.be.true;
      expect(result).to.eql('Teststudy');
    });

    it('should return null if proband does not exist', async () => {
      // Arrange
      fetchMock.get(
        {
          url: 'express:/user/users/:pseudonym',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify(null),
        }
      );

      // Act
      const result = await userserviceClient.getStudyOfProband(
        'TEST-DOESNOTEXIST'
      );

      // Assert
      expect(
        fetchMock.called('express:/user/users/TEST-DOESNOTEXIST', {
          method: 'GET',
        })
      ).to.be.true;
      expect(result).to.eql(null);
    });
  });

  describe('deleteUserdata', () => {
    it('should call userservice to delete user data', async () => {
      // Arrange
      fetchMock.delete(
        {
          url: 'express:/user/users/derUser',
          query: { keepUsageData: 'true', full: 'false' },
        },
        {
          status: StatusCodes.OK,
        }
      );

      // Act
      await userserviceClient.deleteProbanddata('derUser', true, false);

      // Assert
      expect(
        fetchMock.called('express:/user/users/derUser', {
          method: 'DELETE',
          query: { keepUsageData: 'true', full: 'false' },
        })
      ).to.be.true;
    });
  });

  describe('getProbandByIDS', () => {
    it('should call userservice to get a proband by IDS', async () => {
      // Arrange
      const ids = 'ids-1234';
      fetchMock.get('express:/user/users/ids/' + ids, {
        status: StatusCodes.OK,
        body: JSON.stringify({ ids }),
      });

      // Act
      const result = await userserviceClient.getProbandByIDS(ids);

      // Assert
      expect(
        fetchMock.called('express:/user/users/ids/' + ids, {
          method: 'GET',
        })
      ).to.be.true;
      expect(result).not.to.be.null;
      expect(result?.ids).to.eql(ids);
    });

    it('should return null if proband was not found', async () => {
      // Arrange
      const ids = 'ids-4321';
      fetchMock.get('express:/user/users/ids/' + ids, {
        status: StatusCodes.NOT_FOUND,
      });

      // Act
      const result = await userserviceClient.getProbandByIDS(ids);

      // Assert
      expect(
        fetchMock.called('express:/user/users/ids/' + ids, {
          method: 'GET',
        })
      ).to.be.true;
      expect(result).to.be.null;
    });

    it('should throw if another error was returned', async () => {
      // Arrange
      const ids = 'ids-0000';
      fetchMock.get('express:/user/users/ids/' + ids, {
        status: StatusCodes.BAD_REQUEST,
      });

      // Act
      const promise = userserviceClient.getProbandByIDS(ids);

      // Assert
      await expect(promise).to.eventually.be.rejected;
    });
  });

  describe('registerProband', () => {
    it('should call userservice to delete user data', async () => {
      // Arrange
      const expected = {
        ...createProbandRequest(),
        password: 'password1234',
      };
      fetchMock.post(
        {
          url: 'express:/user/studies/:studyName/probands',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify(expected),
        }
      );

      // Act
      const result = await userserviceClient.registerProband(
        'teststudy',
        createProbandRequest()
      );

      // Assert
      expect(
        fetchMock.called('express:/user/studies/:studyName/probands', {
          method: 'POST',
        })
      ).to.be.true;
      expect(result).to.eql(expected);
    });
  });

  describe('getStudy', () => {
    it('should call userservice to get a study by its name', async () => {
      // Arrange
      fetchMock.get(
        {
          url: 'express:/user/studies/:studyName',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify({ name: 'Teststudy', status: 'active' }),
        }
      );

      // Act
      const result = await userserviceClient.getStudy('Teststudy');

      // Assert
      expect(
        fetchMock.called('express:/user/studies/Teststudy', {
          method: 'GET',
        })
      ).to.be.true;
      expect(result).to.eql({ name: 'Teststudy', status: 'active' });
    });
  });

  describe('patchProband', () => {
    it('should call userservice to patch a probands status', async () => {
      // Arrange
      fetchMock.patch(
        {
          url: 'express:/user/users/:pseudonym',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify(null),
        }
      );

      // Act
      await userserviceClient.patchProband('TEST-2222', {
        status: ProbandStatus.DEACTIVATED,
      });

      // Assert
      expect(
        fetchMock.called('express:/user/users/TEST-2222', {
          method: 'PATCH',
          body: { status: 'deactivated' },
        })
      ).to.be.true;
    });

    it('should call userservice to patch a probands complianceContact', async () => {
      // Arrange
      fetchMock.patch(
        {
          url: 'express:/user/users/:pseudonym',
        },
        {
          status: StatusCodes.OK,
          body: JSON.stringify(null),
        }
      );

      // Act
      await userserviceClient.patchProband('TEST-2222', {
        complianceContact: false,
      });

      // Assert
      expect(
        fetchMock.called('express:/user/users/TEST-2222', {
          method: 'PATCH',
          body: { complianceContact: false },
        })
      ).to.be.true;
    });
  });

  function createProband(): ProbandInternalDto {
    return {
      pseudonym: 'TEST-1234',
      study: 'Teststudy',
      firstLoggedInAt: 'somedate',
      complianceLabresults: true,
      complianceSamples: true,
      complianceBloodsamples: true,
      complianceContact: false,
      accountStatus: AccountStatus.ACCOUNT,
      status: ProbandStatus.DEACTIVATED,
      ids: 'SOME_IDS',
    };
  }

  function createProbandRequest(): ProbandRequestInternalDto {
    return {
      pseudonym: 'TEST-1234',
      ids: 'SOME_IDS',
      complianceLabresults: true,
      complianceSamples: true,
      complianceBloodsamples: true,
      studyCenter: 'THE SC',
      examinationWave: 1,
    };
  }
});
