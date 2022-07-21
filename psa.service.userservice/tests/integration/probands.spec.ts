/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import sinon, { createSandbox, SinonStub, SinonStubbedInstance } from 'sinon';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import { StatusCodes } from 'http-status-codes';
import {
  MessageQueueClient,
  MessageQueueTestUtils,
} from '@pia/lib-messagequeue';
import {
  AuthServerMock,
  AuthTokenMockBuilder,
  Response,
} from '@pia/lib-service-core';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import {
  CreateIDSProbandRequest,
  CreateProbandExternalResponse,
  CreateProbandRequest,
  ProbandDto,
} from '../../src/models/proband';
import { db } from '../../src/db';
import { AccountStatus } from '../../src/models/accountStatus';
import { ProbandStatus } from '../../src/models/probandStatus';
import { cleanup, setup } from './probands.spec.data/setup.helper';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { probandAuthClient } from '../../src/clients/authServerClient';
import {
  mockGetProbandAccountsByStudyName,
  mockGetProfessionalAccount,
} from './accountServiceRequestMock.helper.spec';

chai.use(chaiHttp);
chai.use(sinonChai);

const probandHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTestStudy1'],
});
const researcherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'researcher1@example.com',
  studies: ['QTestStudy1'],
});
const investigatorHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'investigationteam1@example.com',
  studies: ['QTestStudy1', 'QTestStudy3'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin1',
  studies: [],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'pm1@example.com',
  studies: ['QTestStudy1'],
});

const apiAddress = `http://localhost:${config.public.port}`;

describe('/admin/studies/{studyName}/probands', () => {
  const testSandbox = createSandbox();
  const suiteSandbox = sinon.createSandbox();

  const mqc = new MessageQueueClient(config.servers.messageQueue);

  before(async function () {
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
    AuthServerMock.probandRealm().returnValid();
    AuthServerMock.adminRealm().returnValid();
    await setup();
  });

  afterEach(async function () {
    AuthServerMock.cleanAll();
    await cleanup();
    testSandbox.restore();
  });

  describe('GET /admin/studies/{studyName}/probands', () => {
    beforeEach(() =>
      mockGetProbandAccountsByStudyName(
        testSandbox,
        ['QTestStudy1'],
        ['qtest-proband1', 'qtest-proband2', 'qtest-proband3']
      )
    );

    it('should return 401 if no token is applied', async () => {
      const studyName = 'QTestStudy1';
      const response = await chai
        .request(apiAddress)
        .get(`/admin/studies/${studyName}/probands`);
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 if user is not a PM, UT or Forscher', async () => {
      const studyName = 'QTestStudy1';
      let response;

      response = await chai
        .request(apiAddress)
        .get(`/admin/studies/${studyName}/probands`)
        .set(probandHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
      AuthServerMock.adminRealm().returnValid();

      response = await chai
        .request(apiAddress)
        .get(`/admin/studies/${studyName}/probands`)
        .set(sysadminHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 403 if proband manager is not in the study', async () => {
      const studyName = 'QTestStudy2';
      const response = await chai
        .request(apiAddress)
        .get(`/admin/studies/${studyName}/probands`)
        .set(pmHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 200 if proband manager fetches a proband', async () => {
      // Arrange

      // Act
      const response: { body: ProbandDto[] } = await chai
        .request(apiAddress)
        .get(`/admin/studies/QTestStudy1/probands`)
        .set(pmHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.OK);
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.length(2);
      response.body.forEach((p) => {
        expect(p).to.include({ study: 'QTestStudy1' });
      });
      const proband1 = response.body.find(
        (p) => p.pseudonym === 'qtest-proband1'
      );
      expect(proband1).to.not.be.undefined;
      expect(proband1).to.include({
        ids: null,
        accountStatus: AccountStatus.ACCOUNT,
        status: ProbandStatus.ACTIVE,
      });
      const proband4 = response.body.find(
        (p) => p.pseudonym === 'qtest-proband4'
      );
      expect(proband4).to.not.be.undefined;
      expect(proband4).to.include({
        ids: null,
        accountStatus: AccountStatus.NO_ACCOUNT,
        status: ProbandStatus.ACTIVE,
      });
    });
  });

  describe('POST /admin/studies/{studyName}/probands', () => {
    let authClientUsersMock: SinonStubbedInstance<Users>;
    let findGroupStub: SinonStub;

    beforeEach(function () {
      authClientUsersMock = testSandbox.stub(probandAuthClient.users);
      authClientUsersMock.create.resolves({ id: '1234' });
      authClientUsersMock.addClientRoleMappings.resolves();

      findGroupStub = testSandbox
        .stub(probandAuthClient.groups, 'find')
        .resolves([
          {
            id: 'xyz',
            name: 'QTestStudy1',
            path: '/QTestStudy1',
          },
        ]);
      testSandbox.stub(probandAuthClient.roles, 'findOneByName').resolves({
        id: 'abc-123',
        name: 'Proband',
      });
    });

    it('should return 403 if user is not an investigator', async () => {
      const studyName = 'QTestStudy1';
      const probandRequest = createProbandRequest();
      let result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probands`)
        .set(sysadminHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      AuthServerMock.adminRealm().returnValid();

      result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probands`)
        .set(pmHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      AuthServerMock.adminRealm().returnValid();

      result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probands`)
        .set(researcherHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      AuthServerMock.adminRealm().returnValid();

      result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probands`)
        .set(probandHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 403 if investigator tries but is not in the study', async function () {
      const studyName = 'QTestStudy2';

      const result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(createProbandRequest());
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 428 if planned proband does not exist', async function () {
      const studyName = 'QTestStudy1';
      const result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(createProbandRequest({ pseudonym: 'qtest-proband_new4' }));
      expect(result, result.text).to.have.status(
        StatusCodes.PRECONDITION_REQUIRED
      );
    });

    it('should return 409 if proband already exists', async function () {
      const studyName = 'QTestStudy1';
      const result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(createProbandRequest({ pseudonym: 'qtest-proband1' }));
      expect(result, result.text).to.have.status(StatusCodes.CONFLICT);
    });

    it('should return 500 if creating the account fails', async function () {
      authClientUsersMock.create.rejects();
      const studyName = 'QTestStudy1';

      const result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(createProbandRequest());
      expect(result, result.text).to.have.status(
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    });

    it('should return 200 if creating a new proband', async function () {
      const pseudonym = 'qtest-proband_new1';
      const studyName = 'QTestStudy1';
      const probandCreated =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          mqc,
          'proband.created',
          testSandbox
        );

      const result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(createProbandRequest({ pseudonym }));

      expect(result, result.text).to.have.status(StatusCodes.OK);

      await probandCreated;

      const dbEntry = await db.one<unknown>(
        "SELECT * FROM probands WHERE pseudonym = 'qtest-proband_new1'"
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

    it('should convert the pseudonym to lowercase', async function () {
      const pseudonym = 'QTest-Proband_New1';
      const studyName = 'QTestStudy1';
      const probandCreated =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          mqc,
          'proband.created',
          testSandbox
        );

      const result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(createProbandRequest({ pseudonym }));

      expect(result, result.text).to.have.status(StatusCodes.OK);

      await probandCreated;

      const dbEntry = await db.one<unknown>(
        "SELECT * FROM probands WHERE pseudonym = 'qtest-proband_new1'"
      );
      expect(dbEntry).to.include({ pseudonym: 'qtest-proband_new1' });
    });

    it('should return 200 adding a pseudonym to an ids', async function () {
      findGroupStub.resolves([
        {
          id: 'xyz',
          name: 'QTestStudy3',
          path: '/QTestStudy3',
        },
      ]);

      const existingUserIdsNoStudy = createProbandRequest({
        ids: 'qtest-ids1',
        pseudonym: 'qtest-proband_new2',
      });

      const result = await chai
        .request(apiAddress)
        .post(`/admin/studies/QTestStudy3/probands`)
        .set(investigatorHeader)
        .send(existingUserIdsNoStudy);
      expect(result, result.text).to.have.status(StatusCodes.OK);

      const dbEntry = await db.one<unknown>(
        "SELECT * FROM probands WHERE pseudonym = 'qtest-proband_new2'"
      );
      expect(dbEntry).to.include({
        pseudonym: 'qtest-proband_new2',
        ids: 'qtest-ids1',
        compliance_labresults: true,
        compliance_samples: true,
        compliance_bloodsamples: true,
        study: 'QTestStudy3',
      });
    });
  });

  describe('External WITH API-KEY: POST /probands', () => {
    let authClientUsersMock: SinonStubbedInstance<Users>;

    beforeEach(function () {
      authClientUsersMock = testSandbox.stub(probandAuthClient.users);
      authClientUsersMock.create.resolves({ id: '1234' });
      authClientUsersMock.addClientRoleMappings.resolves();

      testSandbox.stub(probandAuthClient.groups, 'find').resolves([
        {
          id: 'xyz',
          name: 'ZIFCO-Studie',
          path: '/ZIFCO-Studie',
        },
      ]);
      testSandbox.stub(probandAuthClient.roles, 'findOneByName').resolves({
        id: 'abc-123',
        name: 'Proband',
      });
      mockGetProfessionalAccount(testSandbox, {
        username: 'investigationteam2@example.com',
        role: 'Untersuchungsteam',
        studies: ['ZIFCO-Studie'],
      });
    });

    it('should return 401 if api key is wrong', async function () {
      const probandRequest = {
        apiKey: 'only-imaginary',
        ut_email: 'investigationteam2@example.com',
        ...createProbandRequest(),
      };

      const result = await chai
        .request(apiAddress)
        .post('/probands')
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 with a url including error information if sysadmin tries with key', async function () {
      const probandRequest = {
        apiKey: config.apiKey,
        ut_email: 'qtest-sysadmin1',
        ...createProbandRequest(),
      };

      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/probands')
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      expect(result.body.resultURL).to.include('?');
      expect(result.body.resultURL).to.include('created=false');
      expect(result.body.resultURL).to.include('error=USER_NOT_FOUND');
    });

    it('should return 403 with a url including error information if investigator from another study tries', async function () {
      // Arrange
      testSandbox.restore();
      mockGetProfessionalAccount(testSandbox, {
        username: 'investigationteam1@example.com',
        role: 'Untersuchungsteam',
        studies: ['QTestStudy1', 'QTestStudy3'],
      });
      const probandRequest = {
        apiKey: config.apiKey,
        ut_email: 'investigationteam1@example.com',
        ...createProbandRequest(),
      };

      // Act
      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/probands')
        .send(probandRequest);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      expect(result.body.resultURL).to.include('?');
      expect(result.body.resultURL).to.include('created=false');
      expect(result.body.resultURL).to.include('error=NO_ACCESS_TO_STUDY');
    });

    it('should return 428 with a url including error information if planned user is not in the study', async function () {
      // Arrange
      testSandbox.restore();
      mockGetProfessionalAccount(testSandbox, {
        username: 'investigationteam2@example.com',
        role: 'Untersuchungsteam',
        studies: ['ZIFCO-Studie'],
      });
      const probandRequest = {
        apiKey: config.apiKey,
        ut_email: 'investigationteam2@example.com',
        ...createProbandRequest({ pseudonym: 'qtest-proband_new2' }),
      };

      // Act
      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/probands')
        .set(investigatorHeader)
        .send(probandRequest);

      // Assert
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
        ...createProbandRequest({ pseudonym: 'qtest-proband1' }),
      };

      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/probands')
        .set(investigatorHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.CONFLICT);
      expect(result.body.resultURL).to.include('?');
      expect(result.body.resultURL).to.include('created=false');
      expect(result.body.resultURL).to.include('error=PROBAND_ALREADY_EXISTS');
    });

    it('should return 500 with a url including error information if creating the account fails', async function () {
      authClientUsersMock.create.rejects();
      const probandRequest = {
        apiKey: config.apiKey,
        ut_email: 'investigationteam2@example.com',
        ...createProbandRequest({ pseudonym: 'qtest-proband_new1' }),
      };

      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/probands')
        .set(investigatorHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(
        StatusCodes.INTERNAL_SERVER_ERROR
      );
      expect(result.body.resultURL).to.include('?');
      expect(result.body.resultURL).to.include('created=false');
      expect(result.body.resultURL).to.include('error=CREATING_ACCOUNG_FAILED');
    });

    it('should return 200 with a url including the internal pseudonym', async function () {
      const probandCreated =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          mqc,
          'proband.created',
          testSandbox
        );
      const probandRequest = {
        apiKey: config.apiKey,
        ut_email: 'InvestigationTeam2@example.com', // even if email has wrong case
        ...createProbandRequest({ pseudonym: 'QTest-Proband_NEW1' }),
      };

      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/probands')
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.resultURL).to.include('?');
      expect(result.body.resultURL).to.include('created=true');
      expect(result.body.resultURL).to.not.include('error=');

      await probandCreated;

      const dbEntry = await db.one<unknown>(
        "SELECT * FROM probands WHERE pseudonym = 'qtest-proband_new1'"
      );
      expect(dbEntry).to.include({
        pseudonym: 'qtest-proband_new1',
        external_id: 'QTest-Proband_NEW1',
        ids: null,
        compliance_labresults: true,
        compliance_samples: true,
        compliance_bloodsamples: true,
        study: 'ZIFCO-Studie',
      });

      expect(authClientUsersMock.create).to.be.calledOnce;
      expect(authClientUsersMock.addRealmRoleMappings).to.be.calledOnceWith({
        id: '1234',
        realm: 'pia-proband-realm',
        roles: [{ id: 'abc-123', name: 'Proband' }],
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
        pseudonym: 'QTest-Proband_NEW1',
        compliance_labresults: true,
        compliance_samples: true,
        compliance_bloodsamples: true,
        study_center: 'test_sz',
        examination_wave: 1,
      };

      const result: Response<CreateProbandExternalResponse> = await chai
        .request(apiAddress)
        .post('/probands')
        .send(probandRequest);

      await probandCreated;

      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.resultURL).to.include('?');
      expect(result.body.resultURL).to.include('created=true');
      expect(result.body.resultURL).to.not.include('error=');

      const dbEntry = await db.one<unknown>(
        "SELECT * FROM probands WHERE pseudonym = 'qtest-proband_new1'"
      );
      expect(dbEntry).to.include({
        pseudonym: 'qtest-proband_new1',
        ids: null,
        compliance_labresults: true,
        compliance_samples: true,
        compliance_bloodsamples: true,
        study: 'ZIFCO-Studie',
      });

      expect(authClientUsersMock.create).to.be.calledOnce;
      expect(authClientUsersMock.addRealmRoleMappings).to.be.calledOnceWith({
        id: '1234',
        realm: 'pia-proband-realm',
        roles: [{ id: 'abc-123', name: 'Proband' }],
      });
    });
  });

  describe('POST /admin/studies/{studyName}/probandsIDS', () => {
    it('should return 403 if user is not a investigator', async () => {
      const studyName = 'QTestStudy1';
      const probandRequest = createIDSProbandRequest();
      let result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probandsIDS`)
        .set(sysadminHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      AuthServerMock.adminRealm().returnValid();

      result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probandsIDS`)
        .set(pmHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      AuthServerMock.adminRealm().returnValid();

      result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probandsIDS`)
        .set(researcherHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      AuthServerMock.adminRealm().returnValid();

      result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probandsIDS`)
        .set(probandHeader)
        .send(probandRequest);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 403 if investigator tries but is not in the study', async function () {
      const studyName = 'QTestStudy2';

      const result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probandsIDS`)
        .set(investigatorHeader)
        .send(createIDSProbandRequest());
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 409 if proband already exists', async function () {
      const studyName = 'QTestStudy1';

      const result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probandsIDS`)
        .set(investigatorHeader)
        .send(createIDSProbandRequest({ ids: 'qtest-ids1' }));
      expect(result, result.text).to.have.status(StatusCodes.CONFLICT);
    });

    it('should return 204 if creating a new proband', async function () {
      const studyName = 'QTestStudy1';
      const result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probandsIDS`)
        .set(investigatorHeader)
        .send(createIDSProbandRequest());
      expect(result, result.text).to.have.status(StatusCodes.NO_CONTENT);
    });
  });
});

function createProbandRequest(
  overwrite?: Partial<CreateProbandRequest>
): CreateProbandRequest {
  return {
    pseudonym: 'qtest-proband_new1',
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
