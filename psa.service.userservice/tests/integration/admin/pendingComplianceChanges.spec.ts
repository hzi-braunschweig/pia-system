/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import * as sinon from 'sinon';
import fetchMocker from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';

import {
  HttpClient,
  SystemLogInternalDto,
} from '@pia-system/lib-http-clients-internal';
import {
  AuthServerMock,
  AuthTokenMockBuilder,
  MailService,
  Response,
} from '@pia/lib-service-core';

import { db } from '../../../src/db';
import { Server } from '../../../src/server';
import {
  cleanup,
  setupDelete,
  setupGet,
  setupPost,
  setupPut,
} from './pendingComplianceChanges.spec.data/setup.helper';
import { PendingComplianceChange } from '../../../src/models/pendingComplianceChange';
import { config } from '../../../src/config';
import {
  mockGetProbandAccount,
  mockGetProfessionalAccount,
} from '../accountServiceRequestMock.helper.spec';

interface ProbandCompliance {
  username: string;
  compliance_labresults: boolean;
  compliance_samples: boolean;
  compliance_bloodsamples: boolean;
}

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const fetchMock = fetchMocker.sandbox();
const serverSandbox = sinon.createSandbox();
const testSandbox = sinon.createSandbox();

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-api-proband1',
  studies: ['ApiTestStudie1'],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'forscher1@apitest.de',
  studies: ['ApiTestStudie1'],
});
const utHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'ut1@apitest.de',
  studies: ['ApiTestStudie1'],
});
const sysadminHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'sa1@apitest.de',
  studies: [],
});
const pmHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'pm1@apitest.de',
  studies: ['ApiTestStudie1'],
});
const pmHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'pm2@apitest.de',
  studies: ['ApiTestStudie1'],
});
const pmHeader3 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-pm_no_email',
  studies: ['ApiTestStudie1'],
});
const pmHeader4 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'pm4@apitest.de',
  studies: ['ApiTestStudie4'],
});
const pmHeader5 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'pm3@apitest.de',
  studies: ['ApiTestStudie2'],
});

describe('/admin/pendingComplianceChanges', function () {
  before(async function () {
    serverSandbox.stub(MailService, 'sendMail').resolves(true);
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    serverSandbox.restore();
  });

  beforeEach(() => {
    AuthServerMock.adminRealm().returnValid();
    testSandbox
      .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);
    fetchMock.post('express:/log/systemLogs', (_url, opts) => {
      const request = JSON.parse(opts.body as string) as SystemLogInternalDto;

      const body = { ...request };
      body.timestamp = new Date().toString();

      return {
        body,
      };
    });
  });

  afterEach(() => {
    AuthServerMock.cleanAll();
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET /admin/pendingcompliancechanges/{id}', function () {
    beforeEach(async () => {
      await setupGet();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingcompliancechanges/1234560')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingcompliancechanges/1234560')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingcompliancechanges/1234560')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingcompliancechanges/1234560')
        .set(sysadminHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a pm tries that is not involved in the deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingcompliancechanges/1234560')
        .set(pmHeader3);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when the pending compliance change id does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingcompliancechanges/999999')
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with the pending compliance change for pm who is requested_by', async function () {
      const id = 1234560;
      const result = await chai
        .request(apiAddress)
        .get(`/admin/pendingcompliancechanges/${id}`)
        .set(pmHeader1);
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);
      expect(response.id).to.equal(id);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('qtest-api-proband1');
      expect(response.compliance_labresults_from).to.equal(false);
      expect(response.compliance_labresults_to).to.equal(true);
      expect(response.compliance_samples_from).to.equal(false);
      expect(response.compliance_samples_to).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);
    });

    it('should return HTTP 200 with the pending compliance change for pm who is requested_for', async function () {
      const id = 1234560;
      const result = await chai
        .request(apiAddress)
        .get(`/admin/pendingcompliancechanges/${id}`)
        .set(pmHeader2);
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);
      expect(response.id).to.equal(id);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('qtest-api-proband1');
      expect(response.compliance_labresults_from).to.equal(false);
      expect(response.compliance_labresults_to).to.equal(true);
      expect(response.compliance_samples_from).to.equal(false);
      expect(response.compliance_samples_to).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);
    });

    it('should return HTTP 200 with the pending compliance change for pm who is requested_by without email address', async function () {
      const id = 1234561;
      const result = await chai
        .request(apiAddress)
        .get(`/admin/pendingcompliancechanges/${id}`)
        .set(pmHeader3);
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);
      expect(response.id).to.equal(id);
      expect(response.requested_by).to.equal('qtest-pm_no_email');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('qtest-api-proband1');
      expect(response.compliance_labresults_from).to.equal(false);
      expect(response.compliance_labresults_to).to.equal(true);
      expect(response.compliance_samples_from).to.equal(false);
      expect(response.compliance_samples_to).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);
    });
  });

  describe('GET /admin/studies/{studyName}/pendingcompliancechanges', function () {
    beforeEach(async () => {
      await setupGet();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/ApiTestStudie1/pendingcompliancechanges')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/ApiTestStudie1/pendingcompliancechanges')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/ApiTestStudie1/pendingcompliancechanges')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/ApiTestStudie1/pendingcompliancechanges')
        .set(sysadminHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with the pending compliance change for pm who is requested_by', async function () {
      const id = 1234560;
      const expectedLength = 2;
      const result: Response<PendingComplianceChange[]> = await chai
        .request(apiAddress)
        .get('/admin/studies/ApiTestStudie1/pendingcompliancechanges')
        .set(pmHeader2);
      expect(result.body).to.have.lengthOf(expectedLength);
      const response = result.body[0];
      expect(result).to.have.status(StatusCodes.OK);
      expect(response?.id).to.equal(id);
      expect(response?.requested_by).to.equal('pm1@apitest.de');
      expect(response?.requested_for).to.equal('pm2@apitest.de');
      expect(response?.proband_id).to.equal('qtest-api-proband1');
      expect(response?.compliance_labresults_from).to.equal(false);
      expect(response?.compliance_labresults_to).to.equal(true);
      expect(response?.compliance_samples_from).to.equal(false);
      expect(response?.compliance_samples_to).to.equal(true);
      expect(response?.compliance_bloodsamples_from).to.equal(false);
      expect(response?.compliance_bloodsamples_to).to.equal(true);
    });

    it('should return HTTP 200 with the pending compliance change for pm who is requested_for', async function () {
      const id = 1234560;
      const expectedLength = 2;
      const result: Response<PendingComplianceChange[]> = await chai
        .request(apiAddress)
        .get('/admin/studies/ApiTestStudie1/pendingcompliancechanges')
        .set(pmHeader2);
      expect(result.body).to.have.lengthOf(expectedLength);
      const response = result.body[0];
      expect(result).to.have.status(StatusCodes.OK);
      expect(response?.id).to.equal(id);
      expect(response?.requested_by).to.equal('pm1@apitest.de');
      expect(response?.requested_for).to.equal('pm2@apitest.de');
      expect(response?.proband_id).to.equal('qtest-api-proband1');
      expect(response?.compliance_labresults_from).to.equal(false);
      expect(response?.compliance_labresults_to).to.equal(true);
      expect(response?.compliance_samples_from).to.equal(false);
      expect(response?.compliance_samples_to).to.equal(true);
      expect(response?.compliance_bloodsamples_from).to.equal(false);
      expect(response?.compliance_bloodsamples_to).to.equal(true);
    });

    it('should return HTTP 200 with the pending compliance change for pm who is requested_by without email address', async function () {
      const id = 1234561;
      const expectedLength = 2;
      const result: Response<PendingComplianceChange[]> = await chai
        .request(apiAddress)
        .get('/admin/studies/ApiTestStudie1/pendingcompliancechanges')
        .set(pmHeader3);
      expect(result.body).to.have.lengthOf(expectedLength);
      const response = result.body[1];
      expect(result).to.have.status(StatusCodes.OK);
      expect(response?.id).to.equal(id);
      expect(response?.requested_by).to.equal('qtest-pm_no_email');
      expect(response?.requested_for).to.equal('pm2@apitest.de');
      expect(response?.proband_id).to.equal('qtest-api-proband1');
      expect(response?.compliance_labresults_from).to.equal(false);
      expect(response?.compliance_labresults_to).to.equal(true);
      expect(response?.compliance_samples_from).to.equal(false);
      expect(response?.compliance_samples_to).to.equal(true);
      expect(response?.compliance_bloodsamples_from).to.equal(false);
      expect(response?.compliance_bloodsamples_to).to.equal(true);
    });
  });

  describe('POST /admin/pendingcompliancechanges', function () {
    beforeEach(async () => {
      await setupPost();
    });

    afterEach(async () => {
      await cleanup();
    });

    const pDValid1 = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'qtest-api-proband1',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDValid2 = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'qtest-api-proband1',
      compliance_labresults_to: false,
    };

    const pDValid3 = {
      requested_for: 'pm4@apitest.de',
      proband_id: 'qtest-api-proband2',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDwrongFor = {
      requested_for: 'nonexisting@pm.de',
      proband_id: 'qtest-api-proband1',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDwrongProband = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'NonexistingProband',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDNoEmailFor = {
      requested_for: 'qtest-pm_no_email',
      proband_id: 'qtest-api-proband1',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDWrongStudyPM = {
      requested_for: 'pm4@apitest.de',
      proband_id: 'qtest-api-proband1',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDWrongStudyProband = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'qtest-api-proband2',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDConflictProband = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'qtest-api-proband3',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(probandHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(forscherHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(utHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(sysadminHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 422 when a pm tries for himself', async function () {
      // Arrange
      mockGetProfessionalAccount(testSandbox, {
        username: 'pm2@apitest.de',
        role: 'ProbandenManager',
        studies: ['ApiTestStudie1'],
      });

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(pmHeader2)
        .send(pDValid1);

      // Assert
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 404 when a pm from wrong study tries', async function () {
      // Arrange
      mockGetProfessionalAccount(testSandbox, {
        username: 'pm2@apitest.de',
        role: 'ProbandenManager',
        studies: ['ApiTestStudie1'],
      });
      mockGetProbandAccount(
        testSandbox,
        'qtest-api-proband1',
        'ApiTestStudie1'
      );

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(pmHeader4)
        .send(pDValid1);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 422 when requested_for is an unknown user and not create pending compliance change object', async function () {
      // Arrange
      mockGetProfessionalAccount(testSandbox, {
        username: 'pm2@apitest.de',
        role: 'ProbandenManager',
        studies: ['ApiTestStudie1'],
      });
      mockGetProbandAccount(
        testSandbox,
        'qtest-api-proband1',
        'ApiTestStudie1'
      );

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDNoEmailFor);

      // Assert
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
      await db
        .oneOrNone(
          'SELECT * FROM pending_compliance_changes WHERE proband_id=$1',
          ['qtest-api-proband1']
        )
        .then((cc) => {
          expect(cc).to.equal(null);
        });
    });

    it('should return HTTP 404 when requested_for is in wrong study', async function () {
      // Arrange
      mockGetProfessionalAccount(testSandbox, {
        username: 'pm4@apitest.de',
        role: 'ProbandenManager',
        studies: ['ApiTestStudie4'],
      });
      mockGetProbandAccount(
        testSandbox,
        'qtest-api-proband1',
        'ApiTestStudie1'
      );

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDWrongStudyPM);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 when target proband is in wrong study', async function () {
      // Arrange
      mockGetProfessionalAccount(testSandbox, {
        username: 'pm2@apitest.de',
        role: 'ProbandenManager',
        studies: ['ApiTestStudie1'],
      });
      mockGetProbandAccount(
        testSandbox,
        'qtest-api-proband2',
        'ApiTestStudie2'
      );

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDWrongStudyProband);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 when target proband is nonexisting', async function () {
      // Arrange
      mockGetProfessionalAccount(testSandbox, {
        username: 'pm2@apitest.de',
        role: 'ProbandenManager',
        studies: ['ApiTestStudie1'],
      });

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDwrongProband);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 422 when target pm is nonexisting', async function () {
      // Arrange
      mockGetProfessionalAccount(testSandbox, {
        username: 'pm2@apitest.de',
        role: 'ProbandenManager',
        studies: ['ApiTestStudie1'],
      });
      mockGetProbandAccount(
        testSandbox,
        'qtest-api-proband1',
        'ApiTestStudie1'
      );

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDwrongFor);

      // Assert
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 403 when targeted proband has a change request already', async function () {
      // Arrange
      mockGetProfessionalAccount(testSandbox, {
        username: 'pm2@apitest.de',
        role: 'ProbandenManager',
        studies: ['ApiTestStudie1'],
      });

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDConflictProband);

      // Assert
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and create pending compliance change', async function () {
      // Arrange
      mockGetProfessionalAccount(testSandbox, {
        username: 'pm2@apitest.de',
        role: 'ProbandenManager',
        studies: ['ApiTestStudie1'],
      });

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDValid1);

      // Assert
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('qtest-api-proband1');

      expect(response.compliance_labresults_to).to.equal(true);
      expect(response.compliance_samples_to).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);
    });

    it('should return HTTP 200 and create pending compliance change if no_email_pm requests', async function () {
      // Arrange
      mockGetProfessionalAccount(testSandbox, {
        username: 'pm2@apitest.de',
        role: 'ProbandenManager',
        studies: ['ApiTestStudie1'],
      });

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(pmHeader3)
        .send(pDValid1);

      // Assert
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);
      expect(response.requested_by).to.equal('qtest-pm_no_email');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('qtest-api-proband1');

      expect(response.compliance_labresults_to).to.equal(true);
      expect(response.compliance_samples_to).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);
    });
    it('should return HTTP 200 and create pending compliance change with a view missing params', async function () {
      // Arrange
      mockGetProfessionalAccount(testSandbox, {
        username: 'pm2@apitest.de',
        role: 'ProbandenManager',
        studies: ['ApiTestStudie1'],
      });

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDValid2);

      // Assert
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('qtest-api-proband1');

      expect(response.compliance_labresults_to).to.equal(false);
      expect(response.compliance_samples_to).to.equal(true);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);
    });
    it('should return HTTP 200 and create pending compliance change with no four eyes opposition', async function () {
      // Arrange
      mockGetProfessionalAccount(testSandbox, {
        username: 'pm4@apitest.de',
        role: 'ProbandenManager',
        studies: ['ApiTestStudie2'],
      });

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingcompliancechanges')
        .set(pmHeader5)
        .send(pDValid3);

      // Assert
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);
      expect(response.requested_by).to.equal('pm3@apitest.de');
      expect(response.requested_for).to.equal('pm4@apitest.de');
      expect(response.proband_id).to.equal('qtest-api-proband2');

      expect(response.compliance_labresults_to).to.equal(true);
      expect(response.compliance_samples_to).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);
    });
  });

  describe('PUT /admin/pendingcompliancechanges/{id}', function () {
    beforeEach(async () => {
      await setupPut();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingcompliancechanges/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingcompliancechanges/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingcompliancechanges/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingcompliancechanges/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when requested_by pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingcompliancechanges/1234560')
        .set(pmHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 wrong pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingcompliancechanges/1234560')
        .set(pmHeader3)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and change probands compliances, delete compliance needes fb instances and post deletion log', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingcompliancechanges/1234560')
        .set(pmHeader2)
        .send({});
      const response = result.body as PendingComplianceChange;
      expect(result).to.have.status(StatusCodes.OK);

      expect(response.compliance_labresults_to).to.equal(false);
      expect(response.compliance_samples_to).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);

      const proband: ProbandCompliance = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['qtest-api-proband1']
      );
      const instances = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE user_id=$1',
        ['qtest-api-proband1']
      );
      expect(fetchMock.called()).to.be.true;

      const expectedInstanceCount = 3;
      expect(instances.length).to.equal(expectedInstanceCount);
      expect(proband.compliance_labresults).to.equal(false);
      expect(proband.compliance_samples).to.equal(false);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });

    it('should return HTTP 200 and change probands compliances, not delete compliance needes fb instances and post deletion log', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingcompliancechanges/1234561')
        .set(pmHeader2)
        .send({});
      const response = result.body as PendingComplianceChange;

      expect(result).to.have.status(StatusCodes.OK);

      expect(response.compliance_labresults_to).to.equal(false);
      expect(response.compliance_samples_to).to.equal(true);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);

      const proband: ProbandCompliance = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['qtest-api-proband1']
      );
      const instances = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE user_id=$1',
        ['qtest-api-proband1']
      );
      expect(fetchMock.called()).to.be.true;

      const expectedInstanceCount = 5;
      expect(instances.length).to.equal(expectedInstanceCount);
      expect(proband.compliance_labresults).to.equal(false);
      expect(proband.compliance_samples).to.equal(true);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });
  });

  describe('DELETE /admin/pendingcompliancechanges/{id}', function () {
    beforeEach(async () => {
      await setupDelete();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingcompliancechanges/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingcompliancechanges/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingcompliancechanges/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingcompliancechanges/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if pm of another study tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingcompliancechanges/1234560')
        .set(pmHeader4)
        .send({});
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 and cancel changing of proband compliances for requested_by pm', async function () {
      const id = 1234560;
      const result = await chai
        .request(apiAddress)
        .delete(`/admin/pendingcompliancechanges/${id}`)
        .set(pmHeader1)
        .send({});
      const response = result.body as PendingComplianceChange;

      expect(result).to.have.status(StatusCodes.OK);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('qtest-api-proband1');

      expect(response.compliance_labresults_to).to.equal(false);
      expect(response.compliance_samples_to).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);

      const proband: ProbandCompliance = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['qtest-api-proband1']
      );
      const hasPendingComplianceChange =
        (await db.oneOrNone(
          'SELECT * FROM pending_compliance_changes WHERE id=$1',
          [id]
        )) !== null;

      expect(hasPendingComplianceChange).to.be.false;
      expect(proband.compliance_labresults).to.equal(true);
      expect(proband.compliance_samples).to.equal(true);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });

    it('should return HTTP 200 and cancel changing of proband compliances for requested_for pm', async function () {
      const id = 1234560;
      const result = await chai
        .request(apiAddress)
        .delete(`/admin/pendingcompliancechanges/${id}`)
        .set(pmHeader2)
        .send({});
      const response = result.body as PendingComplianceChange;

      expect(result).to.have.status(StatusCodes.OK);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('qtest-api-proband1');

      expect(response.compliance_labresults_to).to.equal(false);
      expect(response.compliance_samples_to).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);

      const proband: ProbandCompliance = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['qtest-api-proband1']
      );
      const hasPendingComplianceChange =
        (await db.oneOrNone(
          'SELECT * FROM pending_compliance_changes WHERE id=$1',
          [id]
        )) !== null;

      expect(hasPendingComplianceChange).to.be.false;
      expect(proband.compliance_labresults).to.equal(true);
      expect(proband.compliance_samples).to.equal(true);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });

    it('should return HTTP 200 and cancel changing of proband compliances for another pm of the same study', async function () {
      const id = 1234560;
      const result = await chai
        .request(apiAddress)
        .delete(`/admin/pendingcompliancechanges/${id}`)
        .set(pmHeader3)
        .send({});
      const response = result.body as PendingComplianceChange;

      expect(result).to.have.status(StatusCodes.OK);
      expect(response.requested_by).to.equal('pm1@apitest.de');
      expect(response.requested_for).to.equal('pm2@apitest.de');
      expect(response.proband_id).to.equal('qtest-api-proband1');

      expect(response.compliance_labresults_to).to.equal(false);
      expect(response.compliance_samples_to).to.equal(false);
      expect(response.compliance_bloodsamples_to).to.equal(true);

      expect(response.compliance_labresults_from).to.equal(true);
      expect(response.compliance_samples_from).to.equal(true);
      expect(response.compliance_bloodsamples_from).to.equal(true);

      const proband: ProbandCompliance = await db.one(
        'SELECT * FROM probands WHERE pseudonym=$1',
        ['qtest-api-proband1']
      );
      const hasPendingComplianceChange =
        (await db.oneOrNone(
          'SELECT * FROM pending_compliance_changes WHERE id=$1',
          [id]
        )) !== null;

      expect(hasPendingComplianceChange).to.be.false;
      expect(proband.compliance_labresults).to.equal(true);
      expect(proband.compliance_samples).to.equal(true);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });
  });
});
