/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ExpiredUsersDeletionService } from '../../src/services/expiredUsersDeletionService';
import sinon from 'sinon';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import fetchMocker, { MockOptions } from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';
import { connectDatabase } from '../../src/db';
import { expect } from 'chai';
import { getRepository, Repository } from 'typeorm';
import { FollowUp } from '../../src/entities/followUp';
import { SymptomTransmission } from '../../src/entities/symptomTransmission';
import { createQuestionnaireInstance } from './instanceCreator.helper';

describe('ExpiredUsersDeletionService', () => {
  const testSandbox = sinon.createSandbox();
  const fetchMock = fetchMocker.sandbox();
  let followUpRepo: Repository<FollowUp>;
  let symptomTransmissionRepo: Repository<SymptomTransmission>;

  before(async () => {
    await connectDatabase();
    followUpRepo = getRepository(FollowUp);
    symptomTransmissionRepo = getRepository(SymptomTransmission);
  });
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });
  afterEach(async () => {
    testSandbox.restore();
    fetchMock.restore();
    await followUpRepo.clear();
    await symptomTransmissionRepo.clear();
  });
  describe('setProbandsDeactivatedIfFollowUpEndDateIsReached', () => {
    it('should do nothing if there is no follow up end date', async () => {
      // Arrange
      // Act
      await ExpiredUsersDeletionService.setProbandsDeactivatedIfFollowUpEndDateIsReached();
      // Assert
      expect(fetchMock.called()).to.be.false;
    });

    it('should send a patch to deactivate a proband with an expired follow up end date', async () => {
      // Arrange
      const followUp = await followUpRepo.save({
        pseudonym: 'TEST-1234567890',
        study: 'Test-Study',
        endDate: new Date(),
      });
      const expectedRequest: MockOptions = {
        matcher: 'express:/user/users/:pseudonym',
        method: 'PATCH',
        params: {
          pseudonym: followUp.pseudonym,
        },
        body: {
          status: 'deactivated',
        },
      };
      fetchMock.mock(expectedRequest, {
        body: null,
      });
      // Act
      await ExpiredUsersDeletionService.setProbandsDeactivatedIfFollowUpEndDateIsReached();
      // Assert
      expect(fetchMock.called(undefined, expectedRequest)).to.be.true;
    });

    it('should send a patch for each proband with an expired follow up end date', async () => {
      // Arrange
      await followUpRepo.save({
        pseudonym: 'TEST-1234567890',
        study: 'Test-Study',
        endDate: new Date(Date.now() - 20000),
      });
      await followUpRepo.save({
        pseudonym: 'TEST-1234567891',
        study: 'Test-Study',
        endDate: new Date(Date.now() - 10000),
      });
      await followUpRepo.save({
        pseudonym: 'TEST-1234567892',
        study: 'Test-Study',
        endDate: new Date(Date.now() + 10000),
      });

      const expectedRequest: MockOptions = {
        matcher: 'express:/user/users/:pseudonym',
        method: 'PATCH',
        body: {
          status: 'deactivated',
        },
      };
      fetchMock.mock(expectedRequest, {
        body: null,
      });
      // Act
      await ExpiredUsersDeletionService.setProbandsDeactivatedIfFollowUpEndDateIsReached();
      // Assert
      expect(fetchMock.calls(undefined, expectedRequest)).to.have.length(2);
    });

    it('should send a patch for each proband with a follow up end date which is null', async () => {
      // Arrange
      await followUpRepo.save({
        pseudonym: 'TEST-1234567890',
        study: 'Test-Study',
        endDate: null,
      });
      await followUpRepo.save({
        pseudonym: 'TEST-1234567891',
        study: 'Test-Study',
        endDate: null,
      });
      await followUpRepo.save({
        pseudonym: 'TEST-1234567892',
        study: 'Test-Study',
        endDate: new Date(Date.now() + 10000),
      });

      const expectedRequest: MockOptions = {
        matcher: 'express:/user/users/:pseudonym',
        method: 'PATCH',
        body: {
          status: 'deactivated',
        },
      };
      fetchMock.mock(expectedRequest, {
        body: null,
      });
      // Act
      await ExpiredUsersDeletionService.setProbandsDeactivatedIfFollowUpEndDateIsReached();
      // Assert
      expect(fetchMock.calls(undefined, expectedRequest)).to.have.length(2);
    });
  });

  describe('deleteProbandsIfEveryQIIsReleasedAndTransmitted', () => {
    it('should do nothing if there is no follow up end date', async () => {
      await ExpiredUsersDeletionService.deleteProbandsIfEveryQIIsReleasedAndTransmitted();
      expect(fetchMock.called()).to.be.false;
    });

    it('should request the questionnaires for an expired followUp and throw an error if request fails', async () => {
      await followUpRepo.save({
        pseudonym: 'TEST-1234567890',
        study: 'Test-Study',
        endDate: new Date(),
      });
      let error: Error | undefined = undefined;
      try {
        await ExpiredUsersDeletionService.deleteProbandsIfEveryQIIsReleasedAndTransmitted();
      } catch (e) {
        error = e as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error instanceof Error, String(error)).to.be.true;
    });

    it('should request the questionnaires for a followUp which is null and throw an error if request fails', async () => {
      await followUpRepo.save({
        pseudonym: 'TEST-1234567890',
        study: 'Test-Study',
        endDate: null,
      });
      let error: Error | undefined = undefined;
      try {
        await ExpiredUsersDeletionService.deleteProbandsIfEveryQIIsReleasedAndTransmitted();
      } catch (e) {
        error = e as Error;
      }
      expect(error).to.not.be.undefined;
      expect(error instanceof Error, String(error)).to.be.true;
    });

    it('should request the questionnaires and request deletion of this proband if there is no questionnaire', async () => {
      // Arrange
      const followUp = await followUpRepo.save({
        pseudonym: 'TEST-1234567890',
        study: 'Test-Study',
        endDate: new Date(),
      });
      const expectedRequestForQIs: MockOptions = {
        matcher:
          'express:/questionnaire/user/:pseudonym/questionnaireInstances',
        method: 'GET',
        params: {
          pseudonym: followUp.pseudonym,
        },
      };
      const expectedRequestToDeleteUser: MockOptions = {
        matcher: 'express:/user/users/:pseudonym',
        method: 'DELETE',
        params: {
          pseudonym: followUp.pseudonym,
        },
        query: {
          keepUsageData: true,
          full: false,
        },
      };
      fetchMock
        .mock(expectedRequestForQIs, {
          status: StatusCodes.OK,
          body: [],
        })
        .mock(expectedRequestToDeleteUser, {
          body: null,
        });

      // Act
      await ExpiredUsersDeletionService.deleteProbandsIfEveryQIIsReleasedAndTransmitted();

      // Assert
      expect(fetchMock.calls(undefined, expectedRequestForQIs)).to.have.length(
        1
      );
      expect(
        fetchMock.calls(undefined, expectedRequestToDeleteUser)
      ).to.have.length(1);
    });

    it('should not delete a proband with an active questionnaire', async () => {
      // Arrange
      const followUp = await followUpRepo.save({
        pseudonym: 'TEST-1234567890',
        study: 'Test-Study',
        endDate: new Date(),
      });
      const expectedRequestForQIs: MockOptions = {
        matcher:
          'express:/questionnaire/user/:pseudonym/questionnaireInstances',
        method: 'GET',
        params: {
          pseudonym: followUp.pseudonym,
        },
      };
      const unexpectedRequestToDeleteUser: MockOptions = {
        matcher: 'express:/user/users/:pseudonym',
        method: 'DELETE',
      };
      fetchMock
        .mock(expectedRequestForQIs, {
          status: StatusCodes.OK,
          body: [
            createQuestionnaireInstance({
              pseudonym: followUp.pseudonym,
              studyId: followUp.study,
              status: 'active',
            }),
          ],
        })
        .mock(unexpectedRequestToDeleteUser, {
          body: null,
        });

      // Act
      await ExpiredUsersDeletionService.deleteProbandsIfEveryQIIsReleasedAndTransmitted();

      // Assert
      expect(fetchMock.calls(undefined, expectedRequestForQIs)).to.have.length(
        1
      );
      expect(
        fetchMock.calls(undefined, unexpectedRequestToDeleteUser)
      ).to.have.length(0);
    });

    it('should not delete a proband with a questionnaire in progress', async () => {
      // Arrange
      const followUp = await followUpRepo.save({
        pseudonym: 'TEST-1234567890',
        study: 'Test-Study',
        endDate: new Date(),
      });
      const expectedRequestForQIs: MockOptions = {
        matcher:
          'express:/questionnaire/user/:pseudonym/questionnaireInstances',
        method: 'GET',
        params: {
          pseudonym: followUp.pseudonym,
        },
      };
      const unexpectedRequestToDeleteUser: MockOptions = {
        matcher: 'express:/user/users/:pseudonym',
        method: 'DELETE',
      };
      fetchMock
        .mock(expectedRequestForQIs, {
          status: StatusCodes.OK,
          body: [
            createQuestionnaireInstance({
              pseudonym: followUp.pseudonym,
              studyId: followUp.study,
              status: 'in_progress',
            }),
          ],
        })
        .mock(unexpectedRequestToDeleteUser, {
          body: null,
        });

      // Act
      await ExpiredUsersDeletionService.deleteProbandsIfEveryQIIsReleasedAndTransmitted();

      // Assert
      expect(fetchMock.calls(undefined, expectedRequestForQIs)).to.have.length(
        1
      );
      expect(
        fetchMock.calls(undefined, unexpectedRequestToDeleteUser)
      ).to.have.length(0);
    });

    it('should not delete a proband with a questionnaire released only once', async () => {
      // Arrange
      const followUp = await followUpRepo.save({
        pseudonym: 'TEST-1234567890',
        study: 'Test-Study',
        endDate: new Date(),
      });
      const expectedRequestForQIs: MockOptions = {
        matcher:
          'express:/questionnaire/user/:pseudonym/questionnaireInstances',
        method: 'GET',
        params: {
          pseudonym: followUp.pseudonym,
        },
      };
      const unexpectedRequestToDeleteUser: MockOptions = {
        matcher: 'express:/user/users/:pseudonym',
        method: 'DELETE',
      };
      fetchMock
        .mock(expectedRequestForQIs, {
          status: StatusCodes.OK,
          body: [
            createQuestionnaireInstance({
              pseudonym: followUp.pseudonym,
              studyId: followUp.study,
              status: 'released_once',
            }),
          ],
        })
        .mock(unexpectedRequestToDeleteUser, {
          body: null,
        });

      // Act
      await ExpiredUsersDeletionService.deleteProbandsIfEveryQIIsReleasedAndTransmitted();

      // Assert
      expect(fetchMock.calls(undefined, expectedRequestForQIs)).to.have.length(
        1
      );
      expect(
        fetchMock.calls(undefined, unexpectedRequestToDeleteUser)
      ).to.have.length(0);
    });

    it('should not delete a proband with only released_twice questionnaires if only one is not transmitted', async () => {
      // Arrange
      const followUp = await followUpRepo.save({
        pseudonym: 'TEST-1234567890',
        study: 'Test-Study',
        endDate: new Date(),
      });
      const transmission = await symptomTransmissionRepo.save({
        pseudonym: followUp.pseudonym,
        study: followUp.study,
        questionnaireInstanceId: 1,
        version: 2,
        transmissionDate: new Date(),
      });

      const expectedRequestForQIs: MockOptions = {
        matcher:
          'express:/questionnaire/user/:pseudonym/questionnaireInstances',
        method: 'GET',
        params: {
          pseudonym: followUp.pseudonym,
        },
      };
      const unexpectedRequestToDeleteUser: MockOptions = {
        matcher: 'express:/user/users/:pseudonym',
        method: 'DELETE',
      };
      fetchMock
        .mock(expectedRequestForQIs, {
          status: StatusCodes.OK,
          body: [
            createQuestionnaireInstance({
              id: transmission.questionnaireInstanceId,
              pseudonym: followUp.pseudonym,
              studyId: followUp.study,
              status: 'released_twice',
            }),
            createQuestionnaireInstance({
              id: transmission.questionnaireInstanceId + 1,
              pseudonym: followUp.pseudonym,
              studyId: followUp.study,
              status: 'released_twice',
            }),
          ],
        })
        .mock(unexpectedRequestToDeleteUser, {
          body: null,
        });

      // Act
      await ExpiredUsersDeletionService.deleteProbandsIfEveryQIIsReleasedAndTransmitted();

      // Assert
      expect(fetchMock.calls(undefined, expectedRequestForQIs)).to.have.length(
        1
      );
      expect(
        fetchMock.calls(undefined, unexpectedRequestToDeleteUser)
      ).to.have.length(0);
    });

    it('should request deletion of a proband if every questionnaire is released twice and transmitted', async () => {
      // Arrange
      const followUp = await followUpRepo.save({
        pseudonym: 'TEST-1234567890',
        study: 'Test-Study',
        endDate: new Date(),
      });
      const transmission1 = await symptomTransmissionRepo.save({
        pseudonym: followUp.pseudonym,
        study: followUp.study,
        questionnaireInstanceId: 1,
        version: 2,
        transmissionDate: new Date(),
      });
      const transmission2 = await symptomTransmissionRepo.save({
        pseudonym: followUp.pseudonym,
        study: followUp.study,
        questionnaireInstanceId: 2,
        version: 2,
        transmissionDate: new Date(),
      });

      const expectedRequestForQIs: MockOptions = {
        matcher:
          'express:/questionnaire/user/:pseudonym/questionnaireInstances',
        method: 'GET',
        params: {
          pseudonym: followUp.pseudonym,
        },
      };
      const expectedRequestToDeleteUser: MockOptions = {
        matcher: 'express:/user/users/:pseudonym',
        method: 'DELETE',
        params: {
          pseudonym: followUp.pseudonym,
        },
        query: {
          keepUsageData: true,
          full: false,
        },
      };
      fetchMock
        .mock(expectedRequestForQIs, {
          status: StatusCodes.OK,
          body: [
            createQuestionnaireInstance({
              id: transmission1.questionnaireInstanceId,
              pseudonym: followUp.pseudonym,
              studyId: followUp.study,
              status: 'released_twice',
            }),
            createQuestionnaireInstance({
              id: transmission2.questionnaireInstanceId,
              pseudonym: followUp.pseudonym,
              studyId: followUp.study,
              status: 'released_twice',
            }),
          ],
        })
        .mock(expectedRequestToDeleteUser, {
          body: null,
        });

      // Act
      await ExpiredUsersDeletionService.deleteProbandsIfEveryQIIsReleasedAndTransmitted();

      // Assert
      expect(fetchMock.calls(undefined, expectedRequestForQIs)).to.have.length(
        1
      );
      expect(
        fetchMock.calls(undefined, expectedRequestToDeleteUser)
      ).to.have.length(1);
    });
  });
});
