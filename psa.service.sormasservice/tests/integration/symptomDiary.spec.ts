/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { createSandbox, SinonStub, useFakeTimers } from 'sinon';
import chaiHttp from 'chai-http';
import {
  HttpClient,
  ProbandInternalDto,
} from '@pia-system/lib-http-clients-internal';
import fetchMocker, { MockOptions } from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';
import { config } from '../../src/config';
import { Server } from '../../src/server';
import { TaskScheduler } from '../../src/services/taskScheduler';
import {
  DeactivateProbandResponse,
  RegisterProbandResponse,
  UpdateProbandResponse,
} from '../../src/models/symptomDiary';
import { getRepository } from 'typeorm';
import { FollowUp } from '../../src/entities/followUp';
import { RequestTokenResponseSuccess } from '../../src/handlers/tokenHandler';
import {
  createJournalPersonDto,
  createProband,
  createProbandResponse,
} from './instanceCreator.helper';
import { MailService } from '@pia/lib-service-core';

chai.use(chaiHttp);
chai.use(sinonChai);

const apiAddress = `http://localhost:${config.public.port}`;

describe('/symptomdiary', () => {
  const suiteSandbox = createSandbox();
  const testSandbox = createSandbox();
  const fetchMock = fetchMocker.sandbox();
  let sendMailStub: SinonStub;

  before(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    suiteSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    suiteSandbox.stub(TaskScheduler, 'init');
    suiteSandbox.stub(TaskScheduler, 'stop');
    await Server.init();
  });

  after(async () => {
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(() => {
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
    sendMailStub = testSandbox.stub(MailService, 'sendMail').resolves(true);
  });

  afterEach(async () => {
    fetchMock.restore();
    testSandbox.restore();
    await getRepository(FollowUp).clear();
  });

  describe('GET /symptomdiary/probands', () => {
    it('should return http 401 if auth header is missing', async () => {
      // Arrange
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/symptomdiary/probands');

      // Assert
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return http 401 if auth token is expired', async () => {
      // Arrange
      const authHeader = await getAuthHeader();
      const clock = useFakeTimers(new Date());
      const MILLISECONDS_PER_SECOND = 1000;
      const validityDuration =
        (config.sormasOnPia.tokenValidity + 1) * MILLISECONDS_PER_SECOND;

      // Act
      await chai
        .request(apiAddress)
        .get('/symptomdiary/probands')
        .set(authHeader);

      clock.tick(validityDuration);

      const result = await chai
        .request(apiAddress)
        .get('/symptomdiary/probands')
        .set(authHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
      clock.restore();
    });

    it('should return http 200 with a default payload', async () => {
      // Arrange
      const expectedResult = { total: 0, count: 0, results: [] };

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/symptomdiary/probands')
        .set(await getAuthHeader());

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.equal(expectedResult);
    });
  });

  describe('POST /symptomdiary/external-data/{personUUID}', () => {
    it('should return http 401 if auth header is missing', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/symptomdiary/external-data/' + personUUID)
        .send();

      // Assert
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should register proband in userservice and fetch additional data from SORMAS', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      fetchMock
        .get('express:/user/studies/:study', {
          status: StatusCodes.OK,
          body: { pseudonym_prefix: 'TEST', pseudonym_suffix_length: 10 },
        })
        .get('express:/sormas-rest/visits-external/person/' + personUUID, {
          status: StatusCodes.OK,
          body: createJournalPersonDto({ uuid: personUUID }),
        })
        .get('express:/user/users/:pseudonym', {
          status: StatusCodes.NOT_FOUND,
        })
        .post('express:/user/studies/:studyName/probands', {
          status: StatusCodes.OK,
          body: createProbandResponse({ password: 'dummy-secret' }),
        });

      // Act
      await chai
        .request(apiAddress)
        .post('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(
        fetchMock.called(
          'express:/sormas-rest/visits-external/person/' + personUUID,
          'GET'
        )
      ).to.be.true;
      expect(
        fetchMock.called('express:/user/studies/:studyName/probands', 'POST')
      ).to.be.true;
    });

    it('should return success=false if registration in userservice failed', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      fetchMock
        .get('express:/user/studies/:study', {
          status: StatusCodes.OK,
          body: { pseudonym_prefix: 'TEST', pseudonym_suffix_length: 10 },
        })
        .get('express:/user/users/:pseudonym', {
          status: StatusCodes.NOT_FOUND,
        })
        .post('express:/user/studies/:studyName/probands', {
          status: StatusCodes.BAD_REQUEST,
          body: {
            statusCode: StatusCodes.BAD_REQUEST,
            error: 'Not Found',
            message: 'IDS already exists',
          },
        });

      // Act
      const result: { body: RegisterProbandResponse } = await chai
        .request(apiAddress)
        .post('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.include('konnte nicht registriert werden');
    });

    it('should save personal data in personaldataservice', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      fetchMock
        .get('express:/sormas-rest/visits-external/person/' + personUUID, {
          status: StatusCodes.OK,
          body: createJournalPersonDto({ uuid: personUUID }),
        })
        .get('express:/user/studies/:study', {
          status: StatusCodes.OK,
          body: { pseudonym_prefix: 'TEST', pseudonym_suffix_length: 10 },
        })
        .get('express:/user/users/:pseudonym', {
          status: StatusCodes.NOT_FOUND,
        })
        .post('express:/user/studies/:studyName/probands', {
          status: StatusCodes.OK,
          body: createProbandResponse({ password: 'dummy-secret' }),
        });

      // Act
      await chai
        .request(apiAddress)
        .post('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(
        fetchMock.called(
          'express:/personal/personalData/proband/:pseudonym',
          'PUT'
        )
      ).to.be.true;
    });

    it('should delete proband and return success=false if personal data could not be saved', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      fetchMock
        .get('express:/sormas-rest/visits-external/person/' + personUUID, {
          status: StatusCodes.OK,
          body: createJournalPersonDto({ uuid: personUUID }),
        })
        .get('express:/user/studies/:study', {
          status: StatusCodes.OK,
          body: { pseudonym_prefix: 'TEST', pseudonym_suffix_length: 10 },
        })
        .get('express:/user/users/:pseudonym', {
          status: StatusCodes.NOT_FOUND,
        })
        .post('express:/user/studies/:studyName/probands', {
          status: StatusCodes.OK,
          body: createProbandResponse({ password: 'dummy-secret' }),
        })
        .put('express:/personal/personalData/proband/:pseudonym', {
          status: StatusCodes.BAD_REQUEST,
        })
        .delete('express:/user/users/:pseudonym', {
          query: { keepUsageData: 'false', full: 'true' },
          status: StatusCodes.OK,
          body: {},
        });

      // Act
      const result: { body: RegisterProbandResponse } = await chai
        .request(apiAddress)
        .post('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(fetchMock.called('express:/user/users/:pseudonym', 'DELETE')).to.be
        .true;
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.include(
        'Die E-Mail Adresse fehlt oder ist nicht gültig.'
      );
    });

    it('should delete proband and return success=false if email address is empty', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      fetchMock
        .get('express:/sormas-rest/visits-external/person/' + personUUID, {
          status: StatusCodes.OK,
          body: createJournalPersonDto({ uuid: personUUID, emailAddress: '' }),
        })
        .get('express:/user/studies/:study', {
          status: StatusCodes.OK,
          body: { pseudonym_prefix: 'TEST', pseudonym_suffix_length: 10 },
        })
        .get('express:/user/users/:pseudonym', {
          status: StatusCodes.NOT_FOUND,
        })
        .post('express:/user/studies/:studyName/probands', {
          status: StatusCodes.OK,
          body: createProbandResponse({ password: 'dummy-secret' }),
        })
        .put('express:/personal/personalData/proband/:pseudonym', {
          status: StatusCodes.BAD_REQUEST,
        })
        .delete('express:/user/users/:pseudonym', {
          query: { keepUsageData: 'false', full: 'true' },
          status: StatusCodes.OK,
          body: {},
        });

      // Act
      const result: { body: RegisterProbandResponse } = await chai
        .request(apiAddress)
        .post('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(fetchMock.called('express:/user/users/:pseudonym', 'DELETE')).to.be
        .true;
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.include(
        'Die E-Mail Adresse fehlt oder ist nicht gültig.'
      );
    });

    it('should save followUpEndDate', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      const endDate = new Date();
      fetchMock
        .get('express:/sormas-rest/visits-external/person/' + personUUID, {
          status: StatusCodes.OK,
          body: createJournalPersonDto({
            uuid: personUUID,
            latestFollowUpEndDate: endDate,
          }),
        })
        .get('express:/user/studies/:study', {
          status: StatusCodes.OK,
          body: { pseudonym_prefix: 'TEST', pseudonym_suffix_length: 10 },
        })
        .get('express:/user/users/:pseudonym', {
          status: StatusCodes.NOT_FOUND,
        })
        .post('express:/user/studies/:studyName/probands', {
          status: StatusCodes.OK,
          body: createProbandResponse({ password: 'dummy-secret' }),
        })
        .put('express:/personal/personalData/proband/:pseudonym', {
          status: StatusCodes.OK,
          body: {},
        });

      // Act
      await chai
        .request(apiAddress)
        .post('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      const followUp = await getRepository(FollowUp).findOne({
        endDate: endDate,
      });

      // Assert
      expect(followUp).not.to.be.null.and.not.undefined;
    });

    it('should send a registration mail to the new proband', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      fetchMock
        .get('express:/sormas-rest/visits-external/person/' + personUUID, {
          status: StatusCodes.OK,
          body: createJournalPersonDto({ uuid: personUUID }),
        })
        .get('express:/user/studies/:study', {
          status: StatusCodes.OK,
          body: { pseudonym_prefix: 'TEST', pseudonym_suffix_length: 10 },
        })
        .get('express:/user/users/:pseudonym', {
          status: StatusCodes.NOT_FOUND,
        })
        .post('express:/user/studies/:studyName/probands', {
          status: StatusCodes.OK,
          body: createProbandResponse({ password: 'dummy-secret' }),
        })
        .put('express:/personal/personalData/proband/:pseudonym', {
          status: StatusCodes.OK,
          body: {},
        });

      // Act
      await chai
        .request(apiAddress)
        .post('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(sendMailStub).to.have.been.calledOnce;
    });

    it('should successfully register proband', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      fetchMock
        .get('express:/sormas-rest/visits-external/person/' + personUUID, {
          status: StatusCodes.OK,
          body: createJournalPersonDto({ uuid: personUUID }),
        })
        .get('express:/user/studies/:study', {
          status: StatusCodes.OK,
          body: { pseudonym_prefix: 'TEST', pseudonym_suffix_length: 10 },
        })
        .get('express:/user/users/:pseudonym', {
          status: StatusCodes.NOT_FOUND,
        })
        .post('express:/user/studies/:studyName/probands', {
          status: StatusCodes.OK,
          body: createProbandResponse({ password: 'dummy-secret' }),
        })
        .put('express:/personal/personalData/proband/:pseudonym', {
          status: StatusCodes.OK,
          body: {},
        });

      // Act
      const result: { body: RegisterProbandResponse } = await chai
        .request(apiAddress)
        .post('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.success).to.be.true;
      expect(result.body.message).to.be.a('string');
      expect(result.body.message)
        .to.include('Teilnehmer:in wurde erfolgreich registriert:')
        .and.to.include(
          'Das Passwort wurde per E-Mail an Teilnehmer:in versendet'
        );
    });
  });

  describe('PUT /symptomdiary/external-data/{personUuid}', () => {
    it('should return http 401 if auth header is missing', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/symptomdiary/external-data/' + personUUID)
        .send();

      // Assert
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should get the data from the userservice and return 404 if proband does not exist', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      fetchMock.get('express:/user/users/ids/:ids', {
        status: StatusCodes.NOT_FOUND,
      });

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
      expect(fetchMock.called('express:/user/users/ids/' + personUUID, 'GET'))
        .to.be.true;
    });

    it('should fetch the data from sormas and return a message if fetching does not work', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      const pseudonym = 'TEST-1234567890';
      fetchMock
        .get('express:/user/users/ids/:ids', {
          status: StatusCodes.OK,
          body: createProband({ pseudonym, ids: personUUID }),
        })
        .get('express:/sormas-rest/visits-external/person/' + personUUID, {
          status: StatusCodes.SERVICE_UNAVAILABLE,
        });

      // Act
      const result: { body: UpdateProbandResponse } = await chai
        .request(apiAddress)
        .put('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(
        fetchMock.called(
          'express:/sormas-rest/visits-external/person/' + personUUID,
          'GET'
        )
      ).to.be.true;
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.include('nicht aus SORMAS laden');
    });
    it('should safe the e-mail address in personaldataservice and return a validation message if saving does not work', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      const pseudonym = 'TEST-1234567890';
      const email = 'test@ERR OR';
      fetchMock
        .get('express:/user/users/ids/' + personUUID, {
          status: StatusCodes.OK,
          body: createProband({ pseudonym, ids: personUUID }),
        })
        .get('express:/sormas-rest/visits-external/person/' + personUUID, {
          status: StatusCodes.OK,
          body: createJournalPersonDto({
            uuid: personUUID,
            emailAddress: email,
          }),
        })
        .put('express:/personal/personalData/proband/:pseudonym', {
          status: StatusCodes.BAD_REQUEST,
        });

      // Act
      const result: { body: UpdateProbandResponse } = await chai
        .request(apiAddress)
        .put('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(
        fetchMock.called(
          'express:/personal/personalData/proband/' + pseudonym,
          'PUT'
        )
      ).to.be.true;
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.include('nicht gültig');
    });
    it('should update and insert missing data and return a success message', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      const pseudonym = 'TEST-1234567890';
      const email = 'test@ERR OR';
      fetchMock
        .get('express:/user/users/ids/:ids', {
          status: StatusCodes.OK,
          body: createProband({ pseudonym, ids: personUUID }),
        })
        .get('express:/sormas-rest/visits-external/person/' + personUUID, {
          status: StatusCodes.OK,
          body: createJournalPersonDto({
            uuid: personUUID,
            emailAddress: email,
          }),
        })
        .put('express:/personal/personalData/proband/:pseudonym', {
          status: StatusCodes.OK,
          body: {},
        });

      // Act
      const result: { body: UpdateProbandResponse } = await chai
        .request(apiAddress)
        .put('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.success).to.be.true;
      expect(result.body.message).to.include('erfolgreich aktualisiert');
      const followUp = await getRepository(FollowUp).findOne({
        pseudonym: pseudonym,
      });
      expect(followUp).to.not.be.undefined;
    });

    it('should update the followUpEndDate and return a success message', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      const pseudonym = 'TEST-1234567890';
      const email = 'test@ERR OR';
      const oldFollowUp = new Date('2021-06-07');
      const newFollowUp = new Date('2021-06-14');
      await getRepository(FollowUp).save({
        pseudonym: pseudonym,
        study: config.sormas.study,
        endDate: oldFollowUp,
      });
      fetchMock
        .get('express:/user/users/ids/:ids', {
          status: StatusCodes.OK,
          body: createProband({ pseudonym, ids: personUUID }),
        })
        .get('express:/sormas-rest/visits-external/person/' + personUUID, {
          status: StatusCodes.OK,
          body: createJournalPersonDto({
            uuid: personUUID,
            emailAddress: email,
            latestFollowUpEndDate: newFollowUp,
          }),
        })
        .put('express:/personal/personalData/proband/:pseudonym', {
          status: StatusCodes.OK,
          body: {},
        });

      // Act
      const result: { body: UpdateProbandResponse } = await chai
        .request(apiAddress)
        .put('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.success).to.be.true;
      expect(result.body.message).to.include('erfolgreich aktualisiert');
      const followUp = await getRepository(FollowUp).findOne({
        pseudonym: pseudonym,
        endDate: newFollowUp,
      });
      expect(followUp).to.not.be.undefined;
    });
  });

  describe('DELETE /symptomdiary/external-data/{personUuid}', () => {
    it('should return http 401 if auth header is missing', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';

      // Act
      const result = await chai
        .request(apiAddress)
        .delete('/symptomdiary/external-data/' + personUUID)
        .send();

      // Assert
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return success=false if proband was not found for person uuid', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      fetchMock.get('express:/user/users/ids/:ids', {
        status: StatusCodes.NOT_FOUND,
      });

      // Act
      const result: { body: DeactivateProbandResponse } = await chai
        .request(apiAddress)
        .delete('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.success).to.be.false;
    });

    it('should return success=false if userservice has trouble getting the proband', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      fetchMock.get('express:/user/users/ids/:ids', {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      });

      // Act
      const result: { body: DeactivateProbandResponse } = await chai
        .request(apiAddress)
        .delete('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.success).to.be.false;
    });

    it('should return success=false if userservice has trouble deactivating the proband', async () => {
      // Arrange
      const pseudonym = 'TEST-1234567890';
      const personUUID = 'test-person2-uuid';
      fetchMock
        .get('express:/user/users/ids/:ids', {
          status: StatusCodes.OK,
          body: createProband({ pseudonym, ids: personUUID }),
        })
        .patch('express:/user/users/:pseudonym', {
          status: StatusCodes.INTERNAL_SERVER_ERROR,
        });

      // Act
      const result: { body: DeactivateProbandResponse } = await chai
        .request(apiAddress)
        .delete('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.success).to.be.false;
    });

    it('should return success=false if follow up was not found', async () => {
      // Arrange
      const pseudonym = 'TEST-1234567890';
      const personUUID = 'test-person2-uuid';
      fetchMock
        .get('express:/user/users/ids/:ids', {
          status: StatusCodes.OK,
          body: createProband({ pseudonym, ids: personUUID }),
        })
        .patch('express:/user/users/:pseudonym', {
          status: StatusCodes.OK,
          body: {},
        });

      // Act
      const result: { body: DeactivateProbandResponse } = await chai
        .request(apiAddress)
        .delete('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.success).to.be.false;
    });

    it('should return success=true if proband was deactivated', async () => {
      // Arrange
      const pseudonym = 'TEST-1234567890';
      const personUUID = 'test-person2-uuid';
      fetchMock
        .get('express:/user/users/ids/:ids', {
          status: StatusCodes.OK,
          body: createProband({ pseudonym, ids: personUUID }),
        })
        .patch('express:/user/users/:pseudonym', {
          status: StatusCodes.OK,
          body: {},
        });
      await getRepository(FollowUp).save({
        pseudonym: pseudonym,
        study: config.sormas.study,
        endDate: new Date('2021-06-07'),
      });

      // Act
      const result: { body: DeactivateProbandResponse } = await chai
        .request(apiAddress)
        .delete('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.success).to.be.true;
    });

    it('should reset the follow up end date', async () => {
      // Arrange
      const pseudonym = 'TEST-1234567890';
      const personUUID = 'test-person2-uuid';
      fetchMock
        .get('express:/user/users/ids/:ids', {
          status: StatusCodes.OK,
          body: createProband({ pseudonym, ids: personUUID }),
        })
        .patch('express:/user/users/:pseudonym', {
          status: StatusCodes.OK,
          body: {},
        });
      await getRepository(FollowUp).save({
        pseudonym: pseudonym,
        study: config.sormas.study,
        endDate: new Date('2021-06-07'),
      });

      // Act
      await chai
        .request(apiAddress)
        .delete('/symptomdiary/external-data/' + personUUID)
        .send()
        .set(await getAuthHeader());
      const followUp = await getRepository(FollowUp).findOne({ pseudonym });

      // Assert
      expect(followUp?.endDate).to.be.null;
    });
  });

  describe('GET /symptomdiary/probands/data', () => {
    it('should return http 400 if auth token is missing', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/symptomdiary/probands/data')
        .query({
          q: personUUID,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return http 401 if auth token is expired', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      const authToken = await getAuthToken();
      const clock = useFakeTimers(new Date());
      const MILLISECONDS_PER_SECOND = 1000;
      const validityDuration =
        (config.sormasOnPia.tokenValidity + 1) * MILLISECONDS_PER_SECOND;

      // Act
      await chai.request(apiAddress).get('/symptomdiary/probands/data').query({
        q: personUUID,
        token: authToken,
      });

      clock.tick(validityDuration);

      const result = await chai
        .request(apiAddress)
        .get('/symptomdiary/probands/data')
        .query({
          q: personUUID,
          token: authToken,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
      clock.restore();
    });

    it('should return http 404 with a not found template', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      const probandByIdsRequest = createProbandByIdsRequest(
        personUUID,
        StatusCodes.NOT_FOUND
      );

      fetchMock.mock(probandByIdsRequest);

      // Act

      const result = await chai
        .request(apiAddress)
        .get('/symptomdiary/probands/data')
        .set('accept-language', 'de-DE')
        .query({
          q: personUUID,
          token: await getAuthToken(),
        });

      // Assert
      expect(fetchMock.called(undefined, probandByIdsRequest)).to.be.true;

      expect(result).to.have.status(StatusCodes.NOT_FOUND);
      expect(result.text).to.include('<!DOCTYPE html>');
      expect(result.text).to.not.include('Nachverfolgungsenddatum');
    });

    it('should return http 200 with a filled out template', async () => {
      // Arrange
      const personUUID = 'test-person2-uuid';
      const pseudonym = 'TEST-1234567890';
      const email = 'test@example.com';
      const followUpEndDate = new Date('2021-06-07');
      const proband = createProband({ pseudonym, ids: personUUID });
      await getRepository(FollowUp).save({
        pseudonym: pseudonym,
        study: config.sormas.study,
        endDate: followUpEndDate,
      });
      const probandByIdsRequest = createProbandByIdsRequest(
        personUUID,
        proband
      );
      const emailRequest = createEmailRequest(pseudonym, email);

      fetchMock.mock(probandByIdsRequest).mock(emailRequest);

      // Act

      const result = await chai
        .request(apiAddress)
        .get('/symptomdiary/probands/data')
        .set('accept-language', 'de-DE')
        .query({
          q: personUUID,
          token: await getAuthToken(),
        });

      // Assert
      expect(fetchMock.called(undefined, probandByIdsRequest)).to.be.true;

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.text).to.include('<!DOCTYPE html>');
      expect(result.text).to.include('Nachverfolgungsenddatum');
      expect(result.text).to.include(pseudonym);
      expect(result.text).to.not.include(email);
      expect(result.text).to.include(followUpEndDate.toISOString());
    });
  });

  function createProbandByIdsRequest(
    ids: string,
    proband: ProbandInternalDto | number
  ): MockOptions {
    return {
      method: 'GET',
      matcher: 'express:/user/users/ids/:ids',
      params: {
        ids: ids,
      },
      response: proband,
    };
  }

  function createEmailRequest(pseudonym: string, email: string): MockOptions {
    return {
      method: 'GET',
      matcher: 'express:/personal/personalData/proband/:pseudonym/email',
      params: {
        pseudonym: pseudonym,
      },
      response: email,
    };
  }
  async function getAuthToken(): Promise<string> {
    const response = await chai.request(apiAddress).post('/requestToken').send({
      email: config.sormasOnPia.username,
      password: config.sormasOnPia.password,
    });
    return (response.body as RequestTokenResponseSuccess).token;
  }

  async function getAuthHeader(): Promise<{ 'x-access-token': string }> {
    return {
      'x-access-token': await getAuthToken(),
    };
  }
});
