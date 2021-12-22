/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { Server } from '../../src/server';
import { cleanup, setup } from './probands.spec.data/setup.helper';
import sinon, { createSandbox } from 'sinon';
import chaiHttp from 'chai-http';
import { config } from '../../src/config';
import chai, { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import JWT from 'jsonwebtoken';
import secretOrPrivateKey from '../secretOrPrivateKey';
import {
  CreateIDSProbandRequest,
  CreateProbandExternalResponse,
  CreateProbandRequest,
  ProbandResponseNew,
} from '../../src/models/proband';
import { db } from '../../src/db';
import fetchMocker from 'fetch-mock';
import { AccountStatus } from '../../src/models/accountStatus';
import { ProbandStatus } from '../../src/models/probandStatus';
import { Response } from './instance.helper.spec';
import {
  CreateAccountRequestInternalDto,
  HttpClient,
} from '@pia-system/lib-http-clients-internal';
import {
  MessageQueueClient,
  MessageQueueTestUtils,
} from '@pia/lib-messagequeue';

chai.use(chaiHttp);

const probandSession = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband1',
  groups: ['QTestStudy1'],
};
const researcherSession = {
  id: 1,
  role: 'Forscher',
  username: 'researcher1@example.com',
  groups: ['QTestStudy1'],
};
const investigatorSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'investigationteam1@example.com',
  groups: ['QTestStudy1', 'QTestStudy3'],
};
const sysadminSession = {
  id: 1,
  role: 'SysAdmin',
  username: 'QTestSystemAdmin1',
};
const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm1@example.com',
  groups: ['QTestStudy1'],
};

const probandHeader = {
  authorization: JWT.sign(probandSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};
const researcherHeader = {
  authorization: JWT.sign(researcherSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};
const investigatorHeader = {
  authorization: JWT.sign(investigatorSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};
const sysadminHeader = {
  authorization: JWT.sign(sysadminSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};
const pmHeader = {
  authorization: JWT.sign(pmSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};

const apiAddress = `http://localhost:${config.public.port}`;

describe('/user/studies/{studyName}/probands', () => {
  const testSandbox = createSandbox();
  const suiteSandbox = sinon.createSandbox();
  const fetchMock = fetchMocker.sandbox();

  const mqc = new MessageQueueClient(config.servers.messageQueue);

  before(async function () {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    suiteSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    await Server.init();
    await mqc.connect(true);
    await mqc.createConsumer('proband.created', async () => {
      return Promise.resolve();
    });
  });

  after(async function () {
    await mqc.disconnect();
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(async function () {
    await setup();
  });

  afterEach(async function () {
    await cleanup();
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET /user/studies/{studyName}/probands', () => {
    it('should return 401 if no token is applied', async () => {
      const studyName = 'QTestStudy1';
      const response = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`);
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 if user is not a proband manager', async () => {
      const studyName = 'QTestStudy1';
      let response;
      response = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`)
        .set(researcherHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
      response = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`)
        .set(probandHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
      response = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`)
        .set(investigatorHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
      response = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`)
        .set(sysadminHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 403 if proband manager is not in the study', async () => {
      const studyName = 'QTestStudy2';
      const response = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`)
        .set(pmHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 200 if proband manager fetches a proband', async () => {
      const studyName = 'QTestStudy1';
      const response: { body: ProbandResponseNew[] } = await chai
        .request(apiAddress)
        .get(`/user/studies/${studyName}/probands`)
        .set(pmHeader);
      expect(response).to.have.status(StatusCodes.OK);
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.length(2);
      response.body.forEach((p) => {
        expect(p).to.include({ study: studyName });
      });
      const proband1 = response.body.find(
        (p) => p.pseudonym === 'QTestProband1'
      );
      expect(proband1).to.not.be.undefined;
      const expectedAttributes: Partial<ProbandResponseNew> = {
        ids: null,
        accountStatus: AccountStatus.ACCOUNT,
        status: ProbandStatus.ACTIVE,
      };
      expect(proband1).to.include(expectedAttributes);
      const proband4 = response.body.find(
        (p) => p.pseudonym === 'QTestProband4'
      );
      expect(proband4).to.not.be.undefined;
      expect(proband4).to.include(expectedAttributes);
    });
  });

  describe('POST /user/studies/{studyName}/probands', () => {
    beforeEach(function () {
      mockAuthserviceCreateUser();
    });

    it('should return 403 if user is not a investigator', async () => {
      const studyName = 'QTestStudy1';
      const probandRequest = createProbandRequest();
      let result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .set(sysadminHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .set(pmHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .set(researcherHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .set(probandHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 403 if investigator tries but is not in the study', async function () {
      const studyName = 'QTestStudy2';

      const result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(createProbandRequest());
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 428 if planned proband does not exist', async function () {
      const studyName = 'QTestStudy1';
      const result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(createProbandRequest({ pseudonym: 'QTestProbandNew4' }));
      expect(result, result.text).to.have.status(
        StatusCodes.PRECONDITION_REQUIRED
      );
    });

    it('should return 409 if proband already exists', async function () {
      const studyName = 'QTestStudy1';
      const result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(createProbandRequest({ pseudonym: 'QTestProband1' }));
      expect(result, result.text).to.have.status(StatusCodes.CONFLICT);
    });

    it('should return 500 if creating the account fails', async function () {
      const studyName = 'QTestStudy1';
      fetchMock.post(
        { url: 'express:/auth/user', overwriteRoutes: true },
        StatusCodes.SERVICE_UNAVAILABLE
      );

      const result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(createProbandRequest());
      expect(result, result.text).to.have.status(
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    });

    it('should return 200 if creating a new proband', async function () {
      const pseudonym = 'QTestProbandNew1';
      const studyName = 'QTestStudy1';
      const probandCreated =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          mqc,
          'proband.created',
          testSandbox
        );

      const result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(createProbandRequest({ pseudonym }));

      expect(result, result.text).to.have.status(StatusCodes.OK);

      await probandCreated;

      const dbEntry = await db.one<unknown>(
        "SELECT * FROM probands WHERE pseudonym = 'QTestProbandNew1'"
      );
      expect(dbEntry).to.include({
        pseudonym,
        ids: null,
        compliance_labresults: true,
        compliance_samples: true,
        compliance_bloodsamples: true,
        study: studyName,
      });
    });

    it('should return 200 adding a pseudonym to an ids', async function () {
      const pseudonym = 'QTestProbandNew2';
      const studyName = 'QTestStudy3';

      const existingUserIdsNoStudy = createProbandRequest({
        ids: 'QTest_IDS1',
        pseudonym,
      });

      const result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(existingUserIdsNoStudy);
      expect(result, result.text).to.have.status(StatusCodes.OK);

      const dbEntry = await db.one<unknown>(
        "SELECT * FROM probands WHERE pseudonym = 'QTestProbandNew2'"
      );
      expect(dbEntry).to.include({
        pseudonym,
        ids: 'QTest_IDS1',
        compliance_labresults: true,
        compliance_samples: true,
        compliance_bloodsamples: true,
        study: studyName,
      });
    });
  });

  describe('External WITH API-KEY: POST /user/probands', () => {
    beforeEach(function () {
      mockAuthserviceCreateUser();
    });

    it('should return 401 if api key is wrong', async function () {
      const probandRequest = {
        apiKey: 'only-imaginary',
        ut_email: 'investigationteam2@example.com',
        ...createProbandRequest(),
      };

      const result = await chai
        .request(apiAddress)
        .post('/user/probands')
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 with a url including error information if sysadmin tries with key', async function () {
      const probandRequest = {
        apiKey: config.apiKey,
        ut_email: 'QTestSystemAdmin1',
        ...createProbandRequest(),
      };

      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/user/probands')
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      expect(result.body.resultURL).to.include('?');
      expect(result.body.resultURL).to.include('created=false');
      expect(result.body.resultURL).to.include('error=USER_NOT_FOUND');
    });

    it('should return 403 with a url including error information if investigator from another study tries', async function () {
      const probandRequest = {
        apiKey: config.apiKey,
        ut_email: 'investigationteam1@example.com',
        ...createProbandRequest(),
      };

      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/user/probands')
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      expect(result.body.resultURL).to.include('?');
      expect(result.body.resultURL).to.include('created=false');
      expect(result.body.resultURL).to.include('error=NO_ACCESS_TO_STUDY');
    });

    it('should return 428 with a url including error information if planned user is not in the study', async function () {
      const probandRequest = {
        apiKey: config.apiKey,
        ut_email: 'investigationteam2@example.com',
        ...createProbandRequest({ pseudonym: 'QTestProbandNew2' }),
      };

      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/user/probands')
        .set(investigatorHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(
        StatusCodes.PRECONDITION_REQUIRED
      );
      expect(result.body.resultURL).to.include('?');
      expect(result.body.resultURL).to.include('created=false');
      expect(result.body.resultURL).to.include(
        'error=NO_PLANNED_PROBAND_FOUND'
      );
    });

    it('should return 409 with a url including error information if proband already exists', async function () {
      const probandRequest = {
        apiKey: config.apiKey,
        ut_email: 'investigationteam2@example.com',
        ...createProbandRequest({ pseudonym: 'QTestProband1' }),
      };

      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/user/probands')
        .set(investigatorHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.CONFLICT);
      expect(result.body.resultURL).to.include('?');
      expect(result.body.resultURL).to.include('created=false');
      expect(result.body.resultURL).to.include('error=PROBAND_ALREADY_EXISTS');
    });

    it('should return 500 with a url including error information if creating the account fails', async function () {
      fetchMock.post(
        { url: 'express:/auth/user', overwriteRoutes: true },
        StatusCodes.SERVICE_UNAVAILABLE
      );
      const probandRequest = {
        apiKey: config.apiKey,
        ut_email: 'investigationteam2@example.com',
        ...createProbandRequest({ pseudonym: 'QTestProbandNew1' }),
      };

      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/user/probands')
        .set(investigatorHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(
        StatusCodes.INTERNAL_SERVER_ERROR
      );
      expect(result.body.resultURL).to.include('?');
      expect(result.body.resultURL).to.include('created=false');
      expect(result.body.resultURL).to.include('error=CREATING_ACCOUNG_FAILED');
    });

    it('should return 200 with a url', async function () {
      const probandCreated =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          mqc,
          'proband.created',
          testSandbox
        );
      const probandRequest = {
        apiKey: config.apiKey,
        ut_email: 'InvestigationTeam2@example.com', // even if email has wrong case
        ...createProbandRequest({ pseudonym: 'QTestProbandNew1' }),
      };

      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/user/probands')
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.resultURL).to.include('?');
      expect(result.body.resultURL).to.include('created=true');
      expect(result.body.resultURL).to.not.include('error=');

      await probandCreated;

      const dbEntry = await db.one<unknown>(
        "SELECT * FROM probands WHERE pseudonym = 'QTestProbandNew1'"
      );
      expect(dbEntry).to.include({
        pseudonym: 'QTestProbandNew1',
        ids: null,
        compliance_labresults: true,
        compliance_samples: true,
        compliance_bloodsamples: true,
        study: 'ZIFCO-Studie',
      });
    });

    it('should return 204 if creating and an old style formatted request was send', async function () {
      const probandCreated =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          mqc,
          'proband.created',
          testSandbox
        );
      const probandRequest = {
        apiKey: config.apiKey,
        ut_email: 'InvestigationTeam2@example.com', // even if email has wrong case
        pseudonym: 'QTestProbandNew1',
        compliance_labresults: true,
        compliance_samples: true,
        compliance_bloodsamples: true,
        study_center: 'test_sz',
        examination_wave: 1,
      };

      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/user/probands')
        .send(probandRequest);

      await probandCreated;

      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.resultURL).to.include('?');
      expect(result.body.resultURL).to.include('created=true');
      expect(result.body.resultURL).to.not.include('error=');

      const dbEntry = await db.one<unknown>(
        "SELECT * FROM probands WHERE pseudonym = 'QTestProbandNew1'"
      );
      expect(dbEntry).to.include({
        pseudonym: 'QTestProbandNew1',
        ids: null,
        compliance_labresults: true,
        compliance_samples: true,
        compliance_bloodsamples: true,
        study: 'ZIFCO-Studie',
      });
    });
  });

  describe('POST /user/studies/{studyName}/probandsIDS', () => {
    it('should return 403 if user is not a investigator', async () => {
      const studyName = 'QTestStudy1';
      const probandRequest = createIDSProbandRequest();
      let result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probandsIDS`)
        .set(sysadminHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probandsIDS`)
        .set(pmHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probandsIDS`)
        .set(researcherHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probandsIDS`)
        .set(probandHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 403 if investigator tries but is not in the study', async function () {
      const studyName = 'QTestStudy2';

      const result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probandsIDS`)
        .set(investigatorHeader)
        .send(createIDSProbandRequest());
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 409 if proband already exists', async function () {
      const studyName = 'QTestStudy1';

      const result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probandsIDS`)
        .set(investigatorHeader)
        .send(createIDSProbandRequest({ ids: 'QTest_IDS1' }));
      expect(result, result.text).to.have.status(StatusCodes.CONFLICT);
    });

    it('should return 204 if creating a new proband', async function () {
      const studyName = 'QTestStudy1';
      const result = await chai
        .request(apiAddress)
        .post(`/user/studies/${studyName}/probandsIDS`)
        .set(investigatorHeader)
        .send(createIDSProbandRequest());
      expect(result, result.text).to.have.status(StatusCodes.NO_CONTENT);
    });
  });

  function mockAuthserviceCreateUser(): void {
    fetchMock.post('express:/auth/user', async (_url, opts) => {
      const user = JSON.parse(
        opts.body as string
      ) as CreateAccountRequestInternalDto;
      try {
        await db.none(
          "INSERT INTO accounts (username, password, role) VALUES ($(username), '', $(role))",
          user
        );
        return {
          body: null,
        };
      } catch (e) {
        return StatusCodes.CONFLICT;
      }
    });
  }
});

function createProbandRequest(
  overwrite?: Partial<CreateProbandRequest>
): CreateProbandRequest {
  return {
    pseudonym: 'QTestProbandNew1',
    complianceLabresults: true,
    complianceSamples: true,
    complianceBloodsamples: true,
    studyCenter: 'test_sz',
    examinationWave: 1,
    ...overwrite,
  };
}

function createIDSProbandRequest(
  overwrite?: Partial<CreateIDSProbandRequest>
): CreateIDSProbandRequest {
  return {
    ids: 'f2ee2c53-f080-44b8-ba36-18e42e234795',
    ...overwrite,
  };
}
