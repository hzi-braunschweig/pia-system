/* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-magic-numbers */
/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon, { SinonStub } from 'sinon';
import * as fetch from 'node-fetch';

import { HttpClient } from '@pia-system/lib-http-clients-internal';
import {
  AuthServerMock,
  AuthTokenMockBuilder,
  MailService,
} from '@pia/lib-service-core';
import { db } from '../../src/db';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import {
  cleanup,
  setup,
} from './pendingPartialDeletions.spec.data/setup.helper';
import { StatusCodes } from 'http-status-codes';
import { PendingPartialDeletionDb } from '../../src/models/pendingPartialDeletion';
import { mockGetProfessionalAccount } from './accountServiceRequestMock.helper.spec';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const serverSandbox = sinon.createSandbox();
const testSandbox = sinon.createSandbox();

const loggingserviceUrl = config.services.loggingservice.url;

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTestStudie1'],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'forscher1@example.com',
  studies: ['QTestStudie1'],
});
const forscherHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'forscher2@example.com',
  studies: ['QTestStudie1'],
});
const forscherHeader3 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher_no_email',
  studies: ['QTestStudie1'],
});
const forscherHeader4 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'forscher4@example.com',
  studies: ['QTestStudie2'],
});
const utHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'ut1@example.com',
  studies: ['QTestStudie1'],
});
const sysadminHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'sa1@example.com',
  studies: [],
});
const pmHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'pm1@example.com',
  studies: ['QTestStudie1'],
});

describe('/admin/pendingPartialDeletions', () => {
  let fetchStub: SinonStub;

  before(async () => {
    serverSandbox.stub(MailService, 'sendMail').resolves(true);
    await Server.init();
  });

  after(async () => {
    await Server.stop();
    serverSandbox.restore();
  });

  beforeEach(() => {
    AuthServerMock.adminRealm().returnValid();
    fetchStub = testSandbox.stub<typeof HttpClient, 'fetch'>(
      HttpClient,
      'fetch'
    );
    fetchStub.callsFake((url, options) => {
      console.log(url);
      let body;
      if (
        url === loggingserviceUrl + '/log/systemLogs' &&
        options.method === 'POST'
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        body = { ...options.body };
        body.timestamp = new Date();
      } else {
        return new fetch.Response(undefined, { status: 404 });
      }
      return new fetch.Response(JSON.stringify(body));
    });
  });

  afterEach(() => {
    AuthServerMock.cleanAll();
    testSandbox.restore();
  });

  describe('GET /admin/pendingpartialdeletions/id', () => {
    before(async () => {
      await setup();
    });

    after(async () => {
      await cleanup();
    });

    it('should return HTTP 403 when a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingpartialdeletions/1234560')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a pm tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingpartialdeletions/1234560')
        .set(pmHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingpartialdeletions/1234560')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingpartialdeletions/1234560')
        .set(sysadminHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a forscher tries that is not involved in the deletion', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingpartialdeletions/1234560')
        .set(forscherHeader3);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 when the pending deletion id does not exist', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingpartialdeletions/999999')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with the pending deletion for forscher who is requestedBy', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingpartialdeletions/1234560')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(1234560);
      expect(result.body.requestedBy).to.equal('forscher1@example.com');
      expect(result.body.requestedFor).to.equal('forscher2@example.com');
      expect(result.body.forInstanceIds.length).to.equal(2);
      expect(result.body.forLabResultsIds.length).to.equal(2);
    });

    it('should return HTTP 200 with the pending deletion for forscher who is requestedFor', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingpartialdeletions/1234560')
        .set(forscherHeader2);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(1234560);
      expect(result.body.requestedBy).to.equal('forscher1@example.com');
      expect(result.body.requestedFor).to.equal('forscher2@example.com');
      expect(result.body.forInstanceIds.length).to.equal(2);
      expect(result.body.forLabResultsIds.length).to.equal(2);
    });

    it('should return HTTP 200 with the pending deletion without sample ids for forscher', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingpartialdeletions/1234561')
        .set(forscherHeader2);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(1234561);
      expect(result.body.requestedBy).to.equal('forscher1@example.com');
      expect(result.body.requestedFor).to.equal('forscher2@example.com');
      expect(result.body.forInstanceIds.length).to.equal(2);
      expect(result.body.forLabResultsIds).to.equal(null);
    });

    it('should return HTTP 200 with the pending deletion without instance ids for forscher', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/pendingpartialdeletions/1234562')
        .set(forscherHeader2);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.equal(1234562);
      expect(result.body.requestedBy).to.equal('forscher1@example.com');
      expect(result.body.requestedFor).to.equal('forscher2@example.com');
      expect(result.body.forInstanceIds).to.equal(null);
      expect(result.body.forLabResultsIds.length).to.equal(2);
    });
  });

  describe('POST /admin/pendingpartialdeletions', () => {
    beforeEach(async () => {
      mockGetProfessionalAccount(testSandbox, {
        username: 'forscher2@example.com',
        role: 'Forscher',
        studies: ['QTestStudie1'],
      });
      await setup();
    });

    afterEach(async () => {
      await cleanup();
    });

    const pDValid1 = {
      requestedFor: 'forscher2@example.com',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'qtest-proband1',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDValid2 = {
      requestedFor: 'forscher2@example.com',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'qtest-proband1',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: null,
    };

    const pDValid3 = {
      requestedFor: 'forscher2@example.com',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'qtest-proband1',
      forInstanceIds: null,
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDwrongFor = {
      requestedFor: 'nonexistingforscher@example.com',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'qtest-proband1',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDNoEmailFor = {
      requestedFor: 'qtest-forscher_no_email',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'qtest-proband1',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDWrongStudyFor = {
      requestedFor: 'forscher4@example.com',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'qtest-proband1',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDWrongStudyInstance = {
      requestedFor: 'forscher2@example.com',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'qtest-proband1',
      forInstanceIds: [123456, 123458],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDWrongStudySample = {
      requestedFor: 'forscher2@example.com',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'qtest-proband1',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11113'],
    };

    const pDWrongInstance = {
      requestedFor: 'forscher2@example.com',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'qtest-proband1',
      forInstanceIds: [123456, 9999999],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDWrongSample = {
      requestedFor: 'forscher2@example.com',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'qtest-proband1',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: ['APISAMPLE_11111', 'APINonExistingId'],
    };

    it('should return HTTP 403 when a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(probandHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a pm tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(pmHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(utHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(sysadminHeader1)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 422 when a forscher tries for himself', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(forscherHeader2)
        .send(pDValid1);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 404 when a researcher from wrong study tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(forscherHeader4)
        .send(pDValid1);
      console.log(result.body);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 422 when requestedFor is no email address', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDNoEmailFor);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 404 when requestedFor is in wrong study', async () => {
      testSandbox.restore();
      mockGetProfessionalAccount(testSandbox, {
        username: 'forscher4@example.com',
        role: 'Forscher',
        studies: ['QTestStudie2'],
      });
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDWrongStudyFor);
      console.log(result.body);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 403 when one target instance is in wrong study', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDWrongStudyInstance);
      console.log(result.body);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when one target sample is in wrong study', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDWrongStudySample);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when one target instance is nonexisting', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDWrongInstance);
      console.log(result.body);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when one target sample is nonexisting', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDWrongSample);
      console.log(result.body);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 422 when target pm is nonexisting', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDwrongFor);
      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('should return HTTP 200 with the created pending partial deletion', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDValid1);
      console.log(result.body);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.requestedBy).to.equal('forscher1@example.com');
      expect(result.body.requestedFor).to.equal('forscher2@example.com');
      expect(result.body.forInstanceIds).to.eql([123456, 123457]);
      expect(result.body.forLabResultsIds).to.eql([
        'APISAMPLE_11111',
        'APISAMPLE_11112',
      ]);
    });

    it('should return HTTP 200 and update proband for proband pending deletion if no_email_pm requests', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(forscherHeader3)
        .send(pDValid1);
      console.log(result.body);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.requestedBy).to.equal('qtest-forscher_no_email');
      expect(result.body.requestedFor).to.equal('forscher2@example.com');
      expect(result.body.forInstanceIds).to.eql([123456, 123457]);
      expect(result.body.forLabResultsIds).to.eql([
        'APISAMPLE_11111',
        'APISAMPLE_11112',
      ]);
    });

    it('should return HTTP 200 with the created pending partial deletion of no sample ids are set', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDValid2);
      console.log(result.body);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.requestedBy).to.equal('forscher1@example.com');
      expect(result.body.requestedFor).to.equal('forscher2@example.com');
      expect(result.body.forInstanceIds).to.eql([123456, 123457]);
      expect(result.body.forLabResultsIds).to.equal(null);
    });

    it('should return HTTP 200 with the created pending partial deletion if no instance ids are set', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDValid3);
      console.log(result.body);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.requestedBy).to.equal('forscher1@example.com');
      expect(result.body.requestedFor).to.equal('forscher2@example.com');
      expect(result.body.forInstanceIds).to.equal(null);
      expect(result.body.forLabResultsIds).to.eql([
        'APISAMPLE_11111',
        'APISAMPLE_11112',
      ]);
    });
  });

  describe('PUT /admin/pendingpartialdeletions/id', () => {
    beforeEach(async () => {
      await setup();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 403 when a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingpartialdeletions/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a pm tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingpartialdeletions/1234560')
        .set(pmHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingpartialdeletions/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingpartialdeletions/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if requestedBy forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingpartialdeletions/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 wrong forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingpartialdeletions/1234560')
        .set(forscherHeader4)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and delete all of the defined data', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingpartialdeletions/1234560')
        .set(forscherHeader2)
        .send({});
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.requestedBy).to.equal('forscher1@example.com');
      expect(result.body.requestedFor).to.equal('forscher2@example.com');
      expect(result.body.forInstanceIds).to.eql([123456, 123457]);
      expect(result.body.forLabResultsIds).to.eql([
        'APISAMPLE_11111',
        'APISAMPLE_11112',
      ]);

      const lab_observations = await db.manyOrNone(
        'SELECT * FROM lab_observations WHERE lab_result_id=ANY(SELECT id FROM lab_results WHERE user_id=$1)',
        ['qtest-proband1']
      );
      const lab_result = await db.manyOrNone(
        'SELECT * FROM lab_results WHERE user_id=$1',
        ['qtest-proband1']
      );
      const questionnaire_instances = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE user_id=$1',
        ['qtest-proband1']
      );
      const questionnaire_instances_queued = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances_queued WHERE user_id=$1',
        ['qtest-proband1']
      );
      const answers = await db.manyOrNone(
        'SELECT * FROM answers WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE user_id=$1)',
        ['qtest-proband1']
      );
      const user_images = await db.manyOrNone(
        'SELECT * FROM user_files WHERE user_id=$1',
        ['qtest-proband1']
      );

      expect(lab_observations.length).to.equal(0);
      expect(lab_result.length).to.equal(0);
      expect(questionnaire_instances.length).to.equal(2);
      expect(questionnaire_instances_queued.length).to.equal(0);
      expect(answers.length).to.equal(0);
      expect(user_images.length).to.equal(0);

      const logDeletionCall = fetchStub.getCall(0);
      expect(logDeletionCall.firstArg)
        .to.be.a('string')
        .and.equal(loggingserviceUrl + '/log/systemLogs');

      expect(questionnaire_instances[0].date_of_release_v1).to.equal(null);
      expect(questionnaire_instances[0].date_of_release_v2).to.equal(null);
      expect(questionnaire_instances[0].cycle).to.equal(0);
      expect(questionnaire_instances[0].status).to.equal('deleted');

      expect(questionnaire_instances[1].date_of_release_v1).to.equal(null);
      expect(questionnaire_instances[1].date_of_release_v2).to.equal(null);
      expect(questionnaire_instances[1].cycle).to.equal(0);
      expect(questionnaire_instances[1].status).to.equal('deleted');
    });

    it('should return HTTP 200 and delete all of the defined instances data', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingpartialdeletions/1234561')
        .set(forscherHeader2)
        .send({});
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.requestedBy).to.equal('forscher1@example.com');
      expect(result.body.requestedFor).to.equal('forscher2@example.com');
      expect(result.body.forInstanceIds).to.eql([123456, 123457]);
      expect(result.body.forLabResultsIds).to.eql(null);

      const lab_observations = await db.manyOrNone(
        'SELECT * FROM lab_observations WHERE lab_result_id=ANY(SELECT id FROM lab_results WHERE user_id=$1)',
        ['qtest-proband1']
      );
      const lab_result = await db.manyOrNone(
        'SELECT * FROM lab_results WHERE user_id=$1',
        ['qtest-proband1']
      );
      const questionnaire_instances = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE user_id=$1',
        ['qtest-proband1']
      );
      const questionnaire_instances_queued = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances_queued WHERE user_id=$1',
        ['qtest-proband1']
      );
      const answers = await db.manyOrNone(
        'SELECT * FROM answers WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE user_id=$1)',
        ['qtest-proband1']
      );
      const user_images = await db.manyOrNone(
        'SELECT * FROM user_files WHERE user_id=$1',
        ['qtest-proband1']
      );

      expect(lab_observations.length).to.equal(4);
      expect(lab_result.length).to.equal(2);
      expect(questionnaire_instances.length).to.equal(2);
      expect(questionnaire_instances_queued.length).to.equal(0);
      expect(answers.length).to.equal(0);
      expect(user_images.length).to.equal(0);

      expect(fetchStub.calledOnce).to.be.true;

      expect(questionnaire_instances[0].date_of_release_v1).to.equal(null);
      expect(questionnaire_instances[0].date_of_release_v2).to.equal(null);
      expect(questionnaire_instances[0].cycle).to.equal(0);
      expect(questionnaire_instances[0].status).to.equal('deleted');

      expect(questionnaire_instances[1].date_of_release_v1).to.equal(null);
      expect(questionnaire_instances[1].date_of_release_v2).to.equal(null);
      expect(questionnaire_instances[1].cycle).to.equal(0);
      expect(questionnaire_instances[1].status).to.equal('deleted');
    });

    it('should return HTTP 200 and delete all of the defined lab result data', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/pendingpartialdeletions/1234562')
        .set(forscherHeader2)
        .send({});
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.requestedBy).to.equal('forscher1@example.com');
      expect(result.body.requestedFor).to.equal('forscher2@example.com');
      expect(result.body.forInstanceIds).to.eql(null);
      expect(result.body.forLabResultsIds).to.eql([
        'APISAMPLE_11111',
        'APISAMPLE_11112',
      ]);

      const lab_observations = await db.manyOrNone(
        'SELECT * FROM lab_observations WHERE lab_result_id=ANY(SELECT id FROM lab_results WHERE user_id=$1)',
        ['qtest-proband1']
      );
      const lab_result = await db.manyOrNone(
        'SELECT * FROM lab_results WHERE user_id=$1',
        ['qtest-proband1']
      );
      const questionnaire_instances = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE user_id=$1',
        ['qtest-proband1']
      );
      const questionnaire_instances_queued = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances_queued WHERE user_id=$1',
        ['qtest-proband1']
      );
      const answers = await db.manyOrNone(
        'SELECT * FROM answers WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE user_id=$1)',
        ['qtest-proband1']
      );
      const user_images = await db.manyOrNone(
        'SELECT * FROM user_files WHERE user_id=$1',
        ['qtest-proband1']
      );

      expect(lab_observations.length).to.equal(0);
      expect(lab_result.length).to.equal(0);
      expect(questionnaire_instances.length).to.equal(2);
      expect(questionnaire_instances_queued.length).to.equal(2);
      expect(answers.length).to.equal(2);
      expect(user_images.length).to.equal(1);

      expect(fetchStub.calledOnce).to.be.true;

      expect(questionnaire_instances[0].status).to.equal('active');
      expect(questionnaire_instances[1].status).to.equal('active');
    });
  });

  describe('DELETE /admin/pendingpartialdeletions/id', () => {
    beforeEach(async () => {
      await setup();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 403 when a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingpartialdeletions/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a pm tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingpartialdeletions/1234560')
        .set(pmHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingpartialdeletions/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingpartialdeletions/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 wrong forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingpartialdeletions/1234560')
        .set(forscherHeader4)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and cancel deletion of proband data for requestedBy forscher', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingpartialdeletions/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(204);

      const pendingPartialDeletion =
        await db.oneOrNone<PendingPartialDeletionDb>(
          'SELECT * FROM pending_partial_deletions WHERE id=$1',
          [1234560]
        );
      expect(pendingPartialDeletion).to.equal(null);
    });

    it('should return HTTP 200 and cancel deletion of proband data for requestedFor forscher', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/admin/pendingpartialdeletions/1234560')
        .set(forscherHeader2)
        .send({});
      expect(result).to.have.status(204);

      const pendingPartialDeletion =
        await db.oneOrNone<PendingPartialDeletionDb>(
          'SELECT * FROM pending_partial_deletions WHERE id=$1',
          [1234560]
        );
      expect(pendingPartialDeletion).to.equal(null);
    });
  });
});
