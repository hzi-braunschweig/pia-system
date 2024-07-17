/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import fetchMocker from 'fetch-mock';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import sinon from 'sinon';
import { getConnection } from 'typeorm';
import { config } from '../../../src/config';
import { SampleDto } from '../../../src/controllers/internal/dtos/sampleDto';
import {
  LabResult,
  LabResultStatus,
  StudyStatus,
} from '../../../src/entities/labResult';
import { Server } from '../../../src/server';
import { LabResultImportHelper } from '../../../src/services/labResultImportHelper';
import { mockCompliance, setupFetchMock } from '../utils/mockFetch';
import { cleanup, setup } from './samples.spec.ts.data/setup.helper';

chai.use(chaiHttp);

describe('/study/{studyName}/participants/{pseudonym}/samples', () => {
  const apiAddress = `http://localhost:${config.internal.port}`;
  const studyName = 'Study';
  const suiteSandbox = sinon.createSandbox();
  const testSandbox = sinon.createSandbox();
  const fetchMock = fetchMocker.sandbox();

  const labResult: LabResult = {
    id: 'SAMPLE-1023456789',
    dummyId: 'SAMPLE-1123456789',
    pseudonym: 'participant-123456789',
    status: LabResultStatus.New,
    studyStatus: StudyStatus.Active,
    dateOfSampling: null,
    newSamplesSent: null,
    performingDoctor: null,
    remark: null,
  };

  before(async function () {
    suiteSandbox.stub(LabResultImportHelper, 'importHl7FromMhhSftp');
    suiteSandbox.stub(LabResultImportHelper, 'importCsvFromHziSftp');

    await setup();
    await Server.init();
  });

  after(async function () {
    await cleanup();
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(() => {
    setupFetchMock(testSandbox, fetchMock);
    mockCompliance(fetchMock, studyName, labResult.pseudonym, 'samples', true);
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('PATCH /{sampleId}', () => {
    beforeEach(async () => {
      // await getConnection().getRepository(LabResult).delete(labResult);
      await getConnection().getRepository(LabResult).save(labResult);
    });

    afterEach(async () => {
      await getConnection().getRepository(LabResult).delete(labResult);
    });

    context('should return 200 when', () => {
      it('updated the lab result for the sample', async () => {
        const sampleId = labResult.id;
        const dateOfSampling = '2024-02-07T11:38:59.000Z';
        const requestBody: SampleDto = {
          dateOfSampling: new Date(dateOfSampling),
          dummyId: labResult.dummyId,
        };

        const response = await chai
          .request(apiAddress)
          .patch(
            '/study/' +
              studyName +
              '/participants/' +
              labResult.pseudonym +
              '/samples/' +
              sampleId
          )
          .send(requestBody);

        // expect(response).to.have.status(StatusCodes.OK);
        expect(response.body).to.deep.include({
          ...labResult,
          ...requestBody,
          dateOfSampling,
        });
      });

      it('updated the lab result for the sample', async () => {
        const sampleId = labResult.id;
        const dateOfSampling = '2024-02-07T11:38:59.000Z';
        const requestBody: SampleDto = {
          dateOfSampling: new Date(dateOfSampling),
        };

        const response = await chai
          .request(apiAddress)
          .patch(
            '/study/' +
              studyName +
              '/participants/' +
              labResult.pseudonym +
              '/samples/' +
              sampleId
          )
          .send(requestBody);

        // expect(response).to.have.status(StatusCodes.OK);
        expect(response.body).to.deep.include({
          ...labResult,
          ...requestBody,
          dateOfSampling,
        });
      });
    });

    context('should return 404 when', () => {
      const expectedStatusCode = StatusCodes.FORBIDDEN;

      it('checked the participants compliance for samples and the result was negative', async () => {
        const requestBody: SampleDto = {
          dateOfSampling: new Date('2024-02-07T11:38:59.000Z'),
        };
        mockCompliance(
          fetchMock,
          studyName,
          labResult.pseudonym,
          'samples',
          false
        );

        const response = await chai
          .request(apiAddress)
          .patch(
            '/study/' +
              studyName +
              '/participants/' +
              labResult.pseudonym +
              '/samples/' +
              labResult.id
          )
          .send(requestBody);

        expect(response).to.have.status(expectedStatusCode);
        expect(response.body).to.deep.equal({
          error: getReasonPhrase(expectedStatusCode),
          statusCode: expectedStatusCode,
          message: 'Participant has not agreed to save samples',
        });
      });
    });

    context('should return 404 when', () => {
      const expectedStatusCode = StatusCodes.NOT_FOUND;

      it('could not find lab result for sample ID', async () => {
        const nonExisitingSampleId = 'SAMPLE-101234';
        const requestBody: SampleDto = {
          dateOfSampling: new Date('2024-02-07T11:38:59.000Z'),
        };

        const response = await chai
          .request(apiAddress)
          .patch(
            '/study/' +
              studyName +
              '/participants/' +
              labResult.pseudonym +
              '/samples/' +
              nonExisitingSampleId
          )
          .send(requestBody);

        expect(response).to.have.status(expectedStatusCode);
        expect(response.body).to.deep.equal({
          error: getReasonPhrase(expectedStatusCode),
          statusCode: expectedStatusCode,
          message: 'Lab result does not exist',
        });
      });

      for (const studyStatus of [
        StudyStatus.Deleted,
        StudyStatus.Deactivated,
      ]) {
        it(`found a lab result but study status is "${studyStatus}"`, async () => {
          const requestBody: SampleDto = {
            dateOfSampling: new Date('2024-02-07T11:38:59.000Z'),
            dummyId: 'WRONG-1123456789',
          };

          await getConnection()
            .getRepository(LabResult)
            .update(labResult, { studyStatus });

          const response = await chai
            .request(apiAddress)
            .patch(
              '/study/' +
                studyName +
                '/participants/' +
                labResult.pseudonym +
                '/samples/' +
                labResult.id
            )
            .send(requestBody);

          expect(response).to.have.status(expectedStatusCode);
          expect(response.body).to.deep.equal({
            error: getReasonPhrase(expectedStatusCode),
            statusCode: expectedStatusCode,
            message: 'Lab result is deleted',
          });
        });
      }
    });

    context('should return 422 when', () => {
      const expectedStatusCode = StatusCodes.UNPROCESSABLE_ENTITY;

      it('received an invalid pseudonym', async () => {
        const invalidPseudonym = 'INVALID_PSEUDONYM';
        const requestBody: SampleDto = {
          dateOfSampling: new Date('2024-02-07T11:38:59.000Z'),
        };

        const response = await chai
          .request(apiAddress)
          .patch(
            '/study/' +
              studyName +
              '/participants/' +
              invalidPseudonym +
              '/samples/' +
              labResult.id
          )
          .send(requestBody);

        expect(response).to.have.status(expectedStatusCode);
        expect(response.body).to.deep.equal({
          error: getReasonPhrase(expectedStatusCode),
          statusCode: expectedStatusCode,
          message:
            "Payload is invalid:\npseudonym: INVALID_PSEUDONYM --> Not match in '^[a-z0-9]+-[0-9]+$'",
        });
      });

      it('received an invalid sample ID', async () => {
        const invalidSampleId = 'INVALID_SAMPLE_ID';
        const requestBody: SampleDto = {
          dateOfSampling: new Date('2024-02-07T11:38:59.000Z'),
        };

        const response = await chai
          .request(apiAddress)
          .patch(
            '/study/' +
              studyName +
              '/participants/' +
              labResult.pseudonym +
              '/samples/' +
              invalidSampleId
          )
          .send(requestBody);

        expect(response).to.have.status(expectedStatusCode);
        expect(response.body).to.deep.equal({
          error: getReasonPhrase(expectedStatusCode),
          statusCode: expectedStatusCode,
          message:
            "Payload is invalid:\nsampleId: INVALID_SAMPLE_ID --> Not match in '^([A-Z]+-)?[0-9]+$'",
        });
      });

      it('received a correct sample ID but dummy ID did not match in lab result', async () => {
        const requestBody: SampleDto = {
          dateOfSampling: new Date('2024-02-07T11:38:59.000Z'),
          dummyId: 'WRONG-1123456789',
        };

        const response = await chai
          .request(apiAddress)
          .patch(
            '/study/' +
              studyName +
              '/participants/' +
              labResult.pseudonym +
              '/samples/' +
              labResult.id
          )
          .send(requestBody);

        expect(response).to.have.status(expectedStatusCode);
        expect(response.body).to.deep.equal({
          error: getReasonPhrase(expectedStatusCode),
          statusCode: expectedStatusCode,
          message: 'Lab result dummy ID does not match',
        });
      });
    });
  });
});
