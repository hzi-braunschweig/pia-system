/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import fetchMocker from 'fetch-mock';
import {
  AuthServerMock,
  AuthTokenMockBuilder,
  MailService,
  Response,
} from '@pia/lib-service-core';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { config } from '../../src/config';
import { db } from '../../src/db';
import { Server } from '../../src/server';
import { cleanup, setup } from './pendingDeletions.spec.data/setup.helper';
import { StatusCodes } from 'http-status-codes';
import {
  PendingDeletionDb,
  PendingDeletionReq,
} from '../../src/models/pendingDeletion';
import { PersonalData } from '../../src/models/personalData';
import { assert } from 'ts-essentials';
import { SystemLogInternalDto } from '@pia-system/lib-http-clients-internal/src';

chai.use(chaiHttp);

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTestStudy1'],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'forscher1@example.com',
  studies: ['QTestStudy1'],
});
const utHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'ut1@example.com',
  studies: ['QTestStudy1'],
});
const sysadminHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'sa1@example.com',
  studies: [],
});
const pmHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'pm1@example.com',
  studies: ['QTestStudy1'],
});
const pmHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'pm2@example.com',
  studies: ['QTestStudy1'],
});
const pmHeader3 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-pm_no_email',
  studies: ['QTestStudy1'],
});
const pmHeader4 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'pm4@example.com',
  studies: ['QTestStudy1'],
});
const pmHeader5 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'pm5@example.com',
  studies: ['QTestStudy2'],
});

const apiAddress = `http://localhost:${config.public.port}`;

describe('/admin/pendingDeletions', function () {
  const fetchMock = fetchMocker.sandbox();
  const serverSandbox = sinon.createSandbox();
  const testSandbox = sinon.createSandbox();

  before(async function () {
    serverSandbox.stub(MailService, 'initService');
    serverSandbox.stub(MailService, 'sendMail').resolves(true);
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    serverSandbox.restore();
  });

  beforeEach(async () => {
    AuthServerMock.adminRealm().returnValid();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE).patch(
      'express:/user/users/:pseudonym',
      {
        status: StatusCodes.NO_CONTENT,
        body: JSON.stringify(null),
      },
      {
        name: 'setComplianceContact',
      }
    );
    await setup();
  });

  afterEach(async function () {
    AuthServerMock.cleanAll();
    testSandbox.restore();
    fetchMock.restore();
    await cleanup();
  });

  describe('GET /admin/pendingdeletions/{pseudonym}', function () {
    it('should return HTTP 403 when a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingdeletions/qtest-proband1')
        .set(probandHeader1);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingdeletions/qtest-proband1')
        .set(forscherHeader1);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingdeletions/qtest-proband1')
        .set(utHeader1);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingdeletions/qtest-proband1')
        .set(sysadminHeader1);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a pm tries that is not involved in the deletion', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingdeletions/qtest-proband1')
        .set(pmHeader4);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when the pending deletion id does not exist', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingdeletions/qtest-proband15')
        .set(pmHeader1);
      expect(result, result.text).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_by', async () => {
      const expectedId = 1234560;
      const result: Response<PendingDeletionReq> = await chai
        .request(apiAddress)
        .get('/admin/pendingdeletions/qtest-proband1')
        .set(pmHeader1);
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(expectedId);
      expect(result.body.requested_by).to.equal('pm1@example.com');
      expect(result.body.requested_for).to.equal('pm2@example.com');
      expect(result.body.proband_id).to.equal('qtest-proband1');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_for', async () => {
      const expectedId = 1234560;
      const result: Response<PendingDeletionReq> = await chai
        .request(apiAddress)
        .get('/admin/pendingdeletions/qtest-proband1')
        .set(pmHeader2);
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(expectedId);
      expect(result.body.requested_by).to.equal('pm1@example.com');
      expect(result.body.requested_for).to.equal('pm2@example.com');
      expect(result.body.proband_id).to.equal('qtest-proband1');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_by without email address', async () => {
      const expectedId = 1234561;
      const result: Response<PendingDeletionReq> = await chai
        .request(apiAddress)
        .get('/admin/pendingdeletions/qtest-proband3')
        .set(pmHeader3);
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(expectedId);
      expect(result.body.requested_by).to.equal('qtest-pm_no_email');
      expect(result.body.requested_for).to.equal('pm1@example.com');
      expect(result.body.proband_id).to.equal('qtest-proband3');
    });

    it('should also accept pseudonyms in uppercase and return HTTP 200', async () => {
      const expectedId = 1234560;
      const result: Response<PendingDeletionReq> = await chai
        .request(apiAddress)
        .get('/admin/pendingdeletions/QTest-Proband1')
        .set(pmHeader1);
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(expectedId);
      expect(result.body.requested_by).to.equal('pm1@example.com');
      expect(result.body.requested_for).to.equal('pm2@example.com');
      expect(result.body.proband_id).to.equal('qtest-proband1');
    });
  });

  describe('POST /admin/pendingdeletions', function () {
    beforeEach(() => {
      fetchMock
        .get('express:/user/professional/:username/allProbands', {
          body: [
            'qtest-proband1',
            'qtest-proband3',
            'qtest-proband4',
            'qtest-proband_without_data',
          ],
        })
        .get('express:/user/users/:pseudonym', {
          body: {
            study: 'QTestStudy1',
          },
        })
        .get('express:/user/studies/:studyName', {
          body: {
            name: 'QTestStudy1',
            has_total_opposition: true,
            has_partial_opposition: true,
            has_four_eyes_opposition: true,
          },
        });
    });

    const pdValid = {
      requested_for: 'pm2@example.com',
      proband_id: 'qtest-proband4',
    };

    const pdValidUppercase = {
      requested_for: 'pm2@example.com',
      proband_id: 'QTest-Proband4',
    };

    const pdNoDataProband = {
      requested_for: 'pm2@example.com',
      proband_id: 'qtest-proband_without_data',
    };

    const pdNoEmailPm = {
      requested_for: 'qtest-pm_no_email',
      proband_id: 'qtest-proband4',
    };

    it('should return HTTP 403 when a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingdeletions')
        .set(probandHeader1)
        .send(pdValid);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingdeletions')
        .set(forscherHeader1)
        .send(pdValid);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingdeletions')
        .set(utHeader1)
        .send(pdValid);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingdeletions')
        .set(sysadminHeader1)
        .send(pdValid);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 422 when a pm tries for himself', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingdeletions')
        .set(pmHeader2)
        .send(pdValid);
      expect(result, result.text).to.have.status(
        StatusCodes.UNPROCESSABLE_ENTITY
      );
    });

    it('should return HTTP 422 when requested_for is no email address and not change proband status', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingdeletions')
        .set(pmHeader1)
        .send(pdNoEmailPm);
      expect(result, result.text).to.have.status(
        StatusCodes.UNPROCESSABLE_ENTITY
      );
      const pendingDeletion = await db.oneOrNone<PendingDeletionDb>(
        'SELECT * FROM pending_deletions WHERE proband_id=$1',
        pdNoEmailPm.proband_id
      );
      expect(pendingDeletion).to.be.null;
      expect(fetchMock.called('setComplianceContact')).to.be.false;
    });

    it('should return HTTP 200 if target proband has no personal data and create a pending deletion', async () => {
      const result: Response<PendingDeletionReq> = await chai
        .request(apiAddress)
        .post('/admin/pendingdeletions')
        .set(pmHeader1)
        .send(pdNoDataProband);
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.requested_by).to.equal('pm1@example.com');
      expect(result.body.requested_for).to.equal(pdNoDataProband.requested_for);
      expect(result.body.proband_id).to.equal(pdNoDataProband.proband_id);
      const pendingDeletion = await db.oneOrNone<PendingDeletionDb>(
        'SELECT * FROM pending_deletions WHERE proband_id=$1',
        pdNoDataProband.proband_id
      );
      expect(pendingDeletion).to.be.not.null;
      expect(fetchMock.called('setComplianceContact')).to.be.false;
    });

    it('should return HTTP 200 and create a pending deletion', async () => {
      const result: Response<PendingDeletionReq> = await chai
        .request(apiAddress)
        .post('/admin/pendingdeletions')
        .set(pmHeader1)
        .send(pdValid);
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.requested_by).to.equal('pm1@example.com');
      expect(result.body.requested_for).to.equal(pdValid.requested_for);
      expect(result.body.proband_id).to.equal(pdValid.proband_id);
      const pendingDeletion = await db.oneOrNone<PendingDeletionDb>(
        'SELECT * FROM pending_deletions WHERE proband_id=$1',
        pdValid.proband_id
      );
      expect(pendingDeletion).to.be.not.null;
      expect(fetchMock.called('setComplianceContact')).to.be.false;
    });

    it('should return HTTP 200 and create a pending deletion if no_email_pm requests', async () => {
      const result: Response<PendingDeletionReq> = await chai
        .request(apiAddress)
        .post('/admin/pendingdeletions')
        .set(pmHeader3)
        .send(pdValid);
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.requested_by).to.equal('qtest-pm_no_email');
      expect(result.body.requested_for).to.equal(pdValid.requested_for);
      expect(result.body.proband_id).to.equal(pdValid.proband_id);
      const pendingDeletion = await db.oneOrNone<PendingDeletionDb>(
        'SELECT * FROM pending_deletions WHERE proband_id=$1',
        pdValid.proband_id
      );
      expect(pendingDeletion).to.be.not.null;
      expect(fetchMock.called('setComplianceContact')).to.be.false;
    });

    it('should also accept pseudonyms in uppercase and return HTTP 200', async () => {
      const result: Response<PendingDeletionReq> = await chai
        .request(apiAddress)
        .post('/admin/pendingdeletions')
        .set(pmHeader1)
        .send(pdValidUppercase);
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.proband_id).to.equal('qtest-proband4');
    });
  });

  describe('PUT /admin/pendingdeletions/{pseudonym}', function () {
    it('should return HTTP 403 when a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingdeletions/qtest-proband1')
        .set(probandHeader1);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingdeletions/qtest-proband1')
        .set(forscherHeader1);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingdeletions/qtest-proband1')
        .set(utHeader1);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingdeletions/qtest-proband1')
        .set(sysadminHeader1);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 requested_by pm tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingdeletions/qtest-proband1')
        .set(pmHeader1);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 wrong pm tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingdeletions/qtest-proband1')
        .set(pmHeader3);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and delete all of probands data', async () => {
      fetchMock.post('express:/log/systemLogs', {
        body: JSON.stringify(createSystemLogResponse()),
      });
      const result: Response<PendingDeletionReq> = await chai
        .request(apiAddress)
        .put('/admin/pendingdeletions/qtest-proband1')
        .set(pmHeader2);
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.requested_by).to.equal('pm1@example.com');
      expect(result.body.requested_for).to.equal('pm2@example.com');
      expect(result.body.proband_id).to.equal('qtest-proband1');
      const personalData = await db.oneOrNone<PendingDeletionDb>(
        'SELECT * FROM personal_data WHERE pseudonym=$1',
        'qtest-proband1'
      );
      expect(personalData).to.be.null;
      expect(fetchMock.called('setComplianceContact')).to.be.true;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(fetchMock.lastCall('setComplianceContact')[1].body).to.contain(
        false
      );
    });

    it('should also accept pseudonyms in uppercase and return HTTP 200', async () => {
      fetchMock.post('express:/log/systemLogs', {
        body: JSON.stringify(createSystemLogResponse()),
      });
      const result: Response<PendingDeletionReq> = await chai
        .request(apiAddress)
        .put('/admin/pendingdeletions/QTest-Proband1')
        .set(pmHeader2);
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.proband_id).to.equal('qtest-proband1');
    });
  });

  describe('DELETE pendingdeletions/{pseudonym}', function () {
    beforeEach(async function () {
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    it('should return HTTP 403 when a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingdeletions/qtest-proband1')
        .set(probandHeader1);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingdeletions/qtest-proband1')
        .set(forscherHeader1);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingdeletions/qtest-proband1')
        .set(utHeader1);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingdeletions/qtest-proband1')
        .set(sysadminHeader1);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a pm of another study tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingdeletions/qtest-proband1')
        .set(pmHeader5);
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 204 and cancel deletion of proband data for requested_by pm', async () => {
      const expectedId = 1234560;
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingdeletions/qtest-proband1')
        .set(pmHeader1);
      expect(result, result.text).to.have.status(StatusCodes.NO_CONTENT);
      const pendingDeletion = await db.oneOrNone<PendingDeletionDb>(
        'SELECT * FROM pending_deletions WHERE id=$1',
        expectedId
      );
      expect(pendingDeletion).to.be.null;
      const personalData = await db.oneOrNone<PersonalData>(
        'SELECT * FROM personal_data WHERE pseudonym=$1',
        'qtest-proband1'
      );
      assert(personalData);
      expect(personalData.pseudonym).to.equal('qtest-proband1');
      expect(fetchMock.called('setComplianceContact')).to.be.false;
    });

    it('should return HTTP 204 and cancel deletion of proband data for requested_for pm', async () => {
      const expectedId = 1234560;
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingdeletions/qtest-proband1')
        .set(pmHeader2);
      expect(result, result.text).to.have.status(StatusCodes.NO_CONTENT);
      const pendingDeletion = await db.oneOrNone<PendingDeletionDb>(
        'SELECT * FROM pending_deletions WHERE id=$1',
        expectedId
      );
      expect(pendingDeletion).to.be.null;
      const personalData = await db.oneOrNone<PersonalData>(
        'SELECT * FROM personal_data WHERE pseudonym=$1',
        'qtest-proband1'
      );
      assert(personalData);
      expect(personalData.pseudonym).to.equal('qtest-proband1');
      expect(fetchMock.called('setComplianceContact')).to.be.false;
    });

    it('should return HTTP 204 and cancel deletion of proband data for another pm of same study', async () => {
      const expectedId = 1234560;
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingdeletions/qtest-proband1')
        .set(pmHeader3);
      expect(result, result.text).to.have.status(StatusCodes.NO_CONTENT);
      const pendingDeletion = await db.oneOrNone<PendingDeletionDb>(
        'SELECT * FROM pending_deletions WHERE id=$1',
        expectedId
      );
      expect(pendingDeletion).to.be.null;
      const personalData = await db.oneOrNone<PersonalData>(
        'SELECT * FROM personal_data WHERE pseudonym=$1',
        'qtest-proband1'
      );
      assert(personalData);
      expect(personalData.pseudonym).to.equal('qtest-proband1');
      expect(fetchMock.called('setComplianceContact')).to.be.false;
    });

    it('should also accept pseudonym in uppercase and return HTTP 204', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingdeletions/QTest-Proband1')
        .set(pmHeader2);
      expect(result, result.text).to.have.status(StatusCodes.NO_CONTENT);
    });
  });

  function createSystemLogResponse(): SystemLogInternalDto {
    return {
      requestedBy: 'pm1@example.com',
      requestedFor: 'pm2@example.com',
      timestamp: new Date().toString(),
      type: 'proband',
    };
  }
});
