/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import JWT from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import sinon from 'sinon';
import fetchMocker from 'fetch-mock';

import { HttpClient } from '@pia-system/lib-http-clients-internal';
import secretOrPrivateKey from '../secretOrPrivateKey';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { cleanup, setup } from './searches.spec.data/setup.helper';
import { SearchCriteria } from '../../src/interactors/searchesInteractor';

chai.use(chaiHttp);

const apiAddress =
  'http://localhost:' + config.public.port.toString() + '/questionnaire';

const probandSession1 = {
  id: 1,
  role: 'Proband',
  username: 'QExportTestProband1',
  groups: ['ApiTestMultiProbands', 'ExportTestStudie'],
};
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QExportTestForscher',
  groups: ['ApiTestMultiProfs', 'ExportTestStudie'],
};
const forscherSession2 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
  groups: ['ApiTestMultiProfs', 'ApiTestStudie'],
};
const sysadminSession = { id: 1, role: 'SysAdmin', username: 'QTestSysAdmin' };
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam',
  groups: ['ApiTestMultiProfs', 'ApiTestStudie'],
};

const invalidToken = JWT.sign(probandSession1, 'thisIsNotAValidPrivateKey', {
  algorithm: 'HS256',
  expiresIn: '24h',
});
const probandToken1 = JWT.sign(probandSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken1 = JWT.sign(forscherSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken2 = JWT.sign(forscherSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const sysadminToken = JWT.sign(sysadminSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const utToken = JWT.sign(utSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const forscherHeader1 = { authorization: forscherToken1 };
const forscherHeader2 = { authorization: forscherToken2 };
const sysadminHeader = { authorization: sysadminToken };
const utHeader = { authorization: utToken };

const sandbox = sinon.createSandbox();
const fetchMock = fetchMocker.sandbox();

describe('/dataExport/searches', function () {
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
  });

  afterEach(() => {
    sandbox.restore();
    fetchMock.restore();
  });

  const validSearchAll: SearchCriteria = {
    start_date: null,
    end_date: null,
    study_name: 'ExportTestStudie',
    questionnaires: [666666, 666667],
    probands: ['QExportTestProband1', 'QExportTestProband2'],
    exportAnswers: true,
    exportLabResults: false,
    exportSamples: false,
    exportSettings: false,
  };

  describe('POST dataExport/searches', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(invalidHeader)
        .send(validSearchAll);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(probandHeader1)
        .send(validSearchAll);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(sysadminHeader)
        .send(validSearchAll);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(utHeader)
        .send(validSearchAll);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher without study access tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(forscherHeader2)
        .send(validSearchAll);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 422 if the payload has no questionnaires but answers should be exported', async function () {
      const invalidSearchNoQuestionnaire: SearchCriteria = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: 'ExportTestStudie',
        questionnaires: [],
        probands: ['QExportTestProband1', 'QExportTestProband2'],
        exportAnswers: true,
        exportLabResults: false,
        exportSamples: false,
        exportSettings: false,
      };

      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(forscherHeader1)
        .send(invalidSearchNoQuestionnaire);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 400 if the payload has no probands', async function () {
      mockGetPseudonyms(['NotSearchedFor']);

      const invalidSearchNoUsers: SearchCriteria = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: 'ExportTestStudie',
        questionnaires: [666666, 666667],
        probands: [],
        exportAnswers: true,
        exportLabResults: false,
        exportSamples: false,
        exportSettings: false,
      };

      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(forscherHeader1)
        .send(invalidSearchNoUsers);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 422 if the payload has no studyname', async function () {
      const invalidSearchNoStudyname: SearchCriteria = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: '',
        questionnaires: [666666, 666667],
        probands: ['QExportTestProband1', 'QExportTestProband2'],
        exportAnswers: true,
        exportLabResults: false,
        exportSamples: false,
        exportSettings: false,
      };

      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(forscherHeader1)
        .send(invalidSearchNoStudyname);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 200 with only the header if the questionnaire does not belong to the study ', async function () {
      mockGetPseudonyms(['QExportTestProband1']);

      const invalidSearchWrongQuestionnaires: SearchCriteria = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: 'ExportTestStudie',
        questionnaires: [99999],
        probands: ['QExportTestProband1'],
        exportAnswers: true,
        exportLabResults: false,
        exportSamples: false,
        exportSettings: false,
      };

      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(forscherHeader1)
        .send(invalidSearchWrongQuestionnaires);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 422 if the proband does not belong to the study ', async function () {
      mockGetPseudonyms(['QExportTestProband1']);

      const invalidSearchWrongQuestionnaires: SearchCriteria = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: 'ExportTestStudie',
        questionnaires: [666666],
        probands: ['QTestProband1'],
        exportAnswers: true,
        exportLabResults: false,
        exportSamples: false,
        exportSettings: false,
      };

      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(forscherHeader1)
        .send(invalidSearchWrongQuestionnaires);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 200 with correct data if a Forscher with study access tries', async function () {
      mockGetPseudonyms([
        'QExportTestProband1',
        'QExportTestProband2',
        'QExportTestProband3',
      ]);

      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(forscherHeader1)
        .send(validSearchAll);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 with specific date if a Forscher with study access tries', async function () {
      mockGetPseudonyms([
        'QExportTestProband1',
        'QExportTestProband2',
        'QExportTestProband3',
      ]);

      const search: SearchCriteria = {
        start_date: new Date('2017-07-07'),
        end_date: new Date('2017-07-08'),
        study_name: 'ExportTestStudie',
        questionnaires: [666666, 666667],
        probands: ['QExportTestProband1'],
        exportAnswers: true,
        exportLabResults: false,
        exportSamples: false,
        exportSettings: false,
      };

      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(forscherHeader1)
        .send(search);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 with specific questionnaire if a Forscher with study access tries', async function () {
      mockGetPseudonyms([
        'QExportTestProband1',
        'QExportTestProband2',
        'QExportTestProband3',
      ]);

      const search: SearchCriteria = {
        start_date: new Date('2017-07-07'),
        end_date: new Date('2017-07-08'),
        study_name: 'ExportTestStudie',
        questionnaires: [666667],
        probands: ['QExportTestProband1'],
        exportAnswers: true,
        exportLabResults: false,
        exportSamples: false,
        exportSettings: false,
      };

      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(forscherHeader1)
        .send(search);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 with specific user if a Forscher with study access tries', async function () {
      mockGetPseudonyms([
        'QExportTestProband1',
        'QExportTestProband2',
        'QExportTestProband3',
      ]);

      const search: SearchCriteria = {
        start_date: new Date('2017-07-07'),
        end_date: new Date('2017-07-08'),
        study_name: 'ExportTestStudie',
        questionnaires: [666667],
        probands: ['QExportTestProband2'],
        exportAnswers: true,
        exportLabResults: false,
        exportSamples: false,
        exportSettings: false,
      };

      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(forscherHeader1)
        .send(search);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 with sample IDs', async function () {
      mockGetPseudonyms([
        'QExportTestProband1',
        'QExportTestProband2',
        'QExportTestProband3',
      ]);

      const search: SearchCriteria = {
        start_date: new Date('2017-07-07'),
        end_date: new Date('2017-07-08'),
        study_name: 'ExportTestStudie',
        questionnaires: [666667],
        probands: ['QExportTestProband1'],
        exportAnswers: false,
        exportLabResults: false,
        exportSamples: true,
        exportSettings: false,
      };

      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(forscherHeader1)
        .send(search);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 with labresults if the payload has no questionnaires and answers should not be exported', async function () {
      mockGetPseudonyms([
        'QExportTestProband1',
        'QExportTestProband2',
        'QExportTestProband3',
      ]);

      const invalidSearchNoQuestionnaire: SearchCriteria = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: 'ExportTestStudie',
        questionnaires: [],
        probands: ['QExportTestProband1', 'QExportTestProband2'],
        exportAnswers: false,
        exportLabResults: true,
        exportSamples: false,
        exportSettings: false,
      };

      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(forscherHeader1)
        .send(invalidSearchNoQuestionnaire);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 200 with only the probands settings stream if neither answers nor labresults should be exported', async function () {
      mockGetPseudonyms([
        'QExportTestProband1',
        'QExportTestProband2',
        'QExportTestProband3',
      ]);

      const invalidSearchNoQuestionnaire: SearchCriteria = {
        start_date: new Date(),
        end_date: new Date(),
        study_name: 'ExportTestStudie',
        questionnaires: [],
        probands: ['QExportTestProband1', 'QExportTestProband2'],
        exportAnswers: false,
        exportLabResults: false,
        exportSamples: false,
        exportSettings: true,
      };

      const result = await chai
        .request(apiAddress)
        .post('/dataExport/searches')
        .set(forscherHeader1)
        .send(invalidSearchNoQuestionnaire);
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
