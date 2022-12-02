/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';
import sinon from 'sinon';
import fetchMocker from 'fetch-mock';

import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { cleanup, setup } from './export.spec.data/setup.helper';
import { ExportOptions } from '../../src/interactors/exportInteractor';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-exportforscher',
  studies: ['ApiTestMultiProfs', 'ExportTestStudie'],
});
const forscherHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['ApiTestMultiProfs', 'ApiTestStudie'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin',
  studies: [],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam',
  studies: ['ApiTestMultiProfs', 'ApiTestStudie'],
});

const sandbox = sinon.createSandbox();
const fetchMock = fetchMocker.sandbox();

describe('/admin/admin/export', function () {
  before(async function () {
    await Server.init();
    await setup();
  });

  after(async function () {
    await Server.stop();
    await cleanup();
  });

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    sandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);

    AuthServerMock.adminRealm().returnValid();
  });

  afterEach(() => {
    sandbox.restore();
    fetchMock.restore();

    AuthServerMock.cleanAll();
  });

  const validSearchAll: ExportOptions = {
    start_date: null,
    end_date: null,
    study_name: 'ExportTestStudie',
    questionnaires: [
      { id: 666666, version: 1 },
      { id: 666666, version: 2 },
    ],
    probands: ['qtest-exportproband1', 'qtest-exportproband2'],
    exports: ['answers'],
  };

  describe('POST /admin/export', function () {
    it('should return HTTP 403 if a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(sysadminHeader)
        .send(validSearchAll);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(utHeader)
        .send(validSearchAll);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher without study access tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader2)
        .send(validSearchAll);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 422 if the payload has no questionnaires but answers should be exported', async function () {
      const invalidSearchNoQuestionnaire: ExportOptions = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: 'ExportTestStudie',
        questionnaires: [],
        probands: ['qtest-exportproband1', 'qtest-exportproband2'],
        exports: ['answers'],
      };

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(invalidSearchNoQuestionnaire);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 400 if the payload has no probands', async function () {
      mockGetPseudonyms(['NotSearchedFor']);

      const invalidSearchNoUsers: ExportOptions = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: 'ExportTestStudie',
        questionnaires: [
          { id: 666666, version: 1 },
          { id: 666666, version: 2 },
        ],
        probands: [],
        exports: ['answers'],
      };

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(invalidSearchNoUsers);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 400 if the payload has no expots', async function () {
      mockGetPseudonyms(['NotSearchedFor']);

      const invalidSearchNoUsers: ExportOptions = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: 'ExportTestStudie',
        questionnaires: [
          { id: 666666, version: 1 },
          { id: 666666, version: 2 },
        ],
        probands: ['qtest-exportproband1', 'qtest-exportproband2'],
        exports: [],
      };

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(invalidSearchNoUsers);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 422 if the payload has no studyname', async function () {
      const invalidSearchNoStudyname: ExportOptions = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: '',
        questionnaires: [
          { id: 666666, version: 1 },
          { id: 666666, version: 2 },
        ],
        probands: ['qtest-exportproband1', 'qtest-exportproband2'],
        exports: ['answers'],
      };

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(invalidSearchNoStudyname);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 200 with only the header if the questionnaire does not belong to the study ', async function () {
      mockGetPseudonyms(['qtest-exportproband1']);

      const invalidSearchWrongQuestionnaires: ExportOptions = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: 'ExportTestStudie',
        questionnaires: [{ id: 99999, version: 1 }],
        probands: ['qtest-exportproband1'],
        exports: ['answers'],
      };

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(invalidSearchWrongQuestionnaires);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 422 if the proband does not belong to the study ', async function () {
      mockGetPseudonyms(['qtest-exportproband1']);

      const invalidSearchWrongQuestionnaires: ExportOptions = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: 'ExportTestStudie',
        questionnaires: [{ id: 666666, version: 1 }],
        probands: ['qtest-proband1'],
        exports: ['answers'],
      };

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(invalidSearchWrongQuestionnaires);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 200 with correct data if a Forscher with study access tries', async function () {
      mockGetPseudonyms([
        'qtest-exportproband1',
        'qtest-exportproband2',
        'qtest-exportproband3',
      ]);

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(validSearchAll);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 when pseudonyms in uppercase', async function () {
      mockGetPseudonyms([
        'qtest-exportproband1',
        'qtest-exportproband2',
        'qtest-exportproband3',
      ]);

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send({
          ...validSearchAll,
          probands: ['QTest-ExportProband1', 'QTest-ExportProband2'],
        });
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 with specific date if a Forscher with study access tries', async function () {
      mockGetPseudonyms([
        'qtest-exportproband1',
        'qtest-exportproband2',
        'qtest-exportproband3',
      ]);

      const search: ExportOptions = {
        start_date: new Date('2017-07-07'),
        end_date: new Date('2017-07-08'),
        study_name: 'ExportTestStudie',
        questionnaires: [
          { id: 666666, version: 1 },
          { id: 666666, version: 2 },
        ],
        probands: ['qtest-exportproband1'],
        exports: ['answers'],
      };

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(search);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 with specific questionnaire if a Forscher with study access tries', async function () {
      mockGetPseudonyms([
        'qtest-exportproband1',
        'qtest-exportproband2',
        'qtest-exportproband3',
      ]);

      const search: ExportOptions = {
        start_date: new Date('2017-07-07'),
        end_date: new Date('2017-07-08'),
        study_name: 'ExportTestStudie',
        questionnaires: [{ id: 666667, version: 1 }],
        probands: ['qtest-exportproband1'],
        exports: ['answers'],
      };

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(search);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 with specific user if a Forscher with study access tries', async function () {
      mockGetPseudonyms([
        'qtest-exportproband1',
        'qtest-exportproband2',
        'qtest-exportproband3',
      ]);

      const search: ExportOptions = {
        start_date: new Date('2017-07-07'),
        end_date: new Date('2017-07-08'),
        study_name: 'ExportTestStudie',
        questionnaires: [{ id: 666667, version: 1 }],
        probands: ['qtest-exportproband2'],
        exports: ['answers'],
      };

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(search);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 with sample IDs', async function () {
      mockGetPseudonyms([
        'qtest-exportproband1',
        'qtest-exportproband2',
        'qtest-exportproband3',
      ]);

      const search: ExportOptions = {
        start_date: new Date('2017-07-07'),
        end_date: new Date('2017-07-08'),
        study_name: 'ExportTestStudie',
        questionnaires: [{ id: 666667, version: 1 }],
        probands: ['qtest-exportproband1'],
        exports: ['samples'],
      };

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(search);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 with labresults if the payload has no questionnaires and answers should not be exported', async function () {
      mockGetPseudonyms([
        'qtest-exportproband1',
        'qtest-exportproband2',
        'qtest-exportproband3',
      ]);

      const invalidSearchNoQuestionnaire: ExportOptions = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: 'ExportTestStudie',
        questionnaires: [],
        probands: ['qtest-exportproband1', 'qtest-exportproband2'],
        exports: ['labresults'],
      };

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(invalidSearchNoQuestionnaire);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 with only the probands settings stream if neither answers nor labresults should be exported', async function () {
      mockGetPseudonyms([
        'qtest-exportproband1',
        'qtest-exportproband2',
        'qtest-exportproband3',
      ]);

      const invalidSearchNoQuestionnaire: ExportOptions = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: 'ExportTestStudie',
        questionnaires: [],
        probands: ['qtest-exportproband1', 'qtest-exportproband2'],
        exports: ['settings'],
      };

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(invalidSearchNoQuestionnaire);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 with only the codebook stream', async function () {
      mockGetPseudonyms([
        'qtest-exportproband1',
        'qtest-exportproband2',
        'qtest-exportproband3',
      ]);

      const codebookSearch: ExportOptions = {
        start_date: null,
        end_date: null,
        study_name: 'ExportTestStudie',
        questionnaires: [{ id: 666667, version: 1 }],
        probands: [],
        exports: ['codebook'],
      };

      const result = await chai
        .request(apiAddress)
        .post('/admin/export')
        .set(forscherHeader1)
        .send(codebookSearch);
      expect(result).to.have.status(StatusCodes.OK);
    });
  });

  function mockGetPseudonyms(body: string[]): void {
    fetchMock.get(
      `http://userservice:5000/user/pseudonyms?study=ExportTestStudie`,
      {
        status: StatusCodes.OK,
        body,
      }
    );
  }
});
