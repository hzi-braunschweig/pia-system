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
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import {
  CreateIDSProbandRequest,
  CreateProbandRequest,
  ProbandDto,
} from '../../src/models/proband';
import { db } from '../../src/db';
import { AccountStatus } from '../../src/models/accountStatus';
import { ProbandStatus } from '../../src/models/probandStatus';
import { cleanup, setup } from './probands.spec.data/setup.helper';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { probandAuthClient } from '../../src/clients/authServerClient';
import { mockGetProbandAccountsByStudyName } from './accountServiceRequestMock.helper.spec';
import { ProbandOrigin } from '@pia-system/lib-http-clients-internal';

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
      const probandRequest = createProbandRequest({
        pseudonym: 'qtest-proband_new1',
      });
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
        .send(createProbandRequest({ pseudonym: 'qtest-proband_new1' }));
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
        .send(createProbandRequest({ pseudonym: 'qtest-proband_new1' }));
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
        ids: 'QTest-IDS1',
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
        ids: 'QTest-IDS1',
        compliance_labresults: true,
        compliance_samples: true,
        compliance_bloodsamples: true,
        study: 'QTestStudy3',
        origin: ProbandOrigin.INVESTIGATOR,
      });
    });

    it('should return 428 if no pseudonym was given', async () => {
      const studyName = 'QTestStudy1';
      const result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(createProbandRequest());
      expect(result, result.text).to.have.status(
        StatusCodes.PRECONDITION_REQUIRED
      );
    });

    it('should return 400 if origin is set to an unsupported value', async () => {
      const pseudonym = 'qtest-proband_new1';
      const studyName = 'QTestStudy1';
      const request = createProbandRequest({
        pseudonym,
        origin: 'some string',
      });

      const result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(request);
      expect(result, result.text).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return 400 if origin is missing', async () => {
      const studyName = 'QTestStudy1';
      const request: Partial<CreateProbandRequest> = {
        pseudonym: 'qtest-proband_new1',
        complianceLabresults: true,
        complianceSamples: true,
        complianceBloodsamples: true,
        studyCenter: 'test_sz',
        examinationWave: 1,
      };

      const result = await chai
        .request(apiAddress)
        .post(`/admin/studies/${studyName}/probands`)
        .set(investigatorHeader)
        .send(request);
      expect(result, result.text).to.have.status(StatusCodes.BAD_REQUEST);
    });
  });

  describe('POST /admin/studies/{studyName}/probandsIDS', () => {
    it('should return 403 if user is not an investigator', async () => {
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
        .send(createIDSProbandRequest({ ids: 'QTest-IDS1' }));
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
    complianceLabresults: true,
    complianceSamples: true,
    complianceBloodsamples: true,
    studyCenter: 'test_sz',
    examinationWave: 1,
    origin: ProbandOrigin.INVESTIGATOR,
    ...overwrite,
  };
}

function createIDSProbandRequest(
  overwrite?: Partial<CreateIDSProbandRequest>
): CreateIDSProbandRequest {
  return {
    ids: 'F2ee2c53-f080-44b8-ba36-18e42e234795',
    ...overwrite,
  };
}
