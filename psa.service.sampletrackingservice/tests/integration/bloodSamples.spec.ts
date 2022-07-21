/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';

import fetchMocker from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';

import { cleanup, setup } from './bloodSamples.spec.data/setup.helper';
import { LabResultImportHelper } from '../../src/services/labResultImportHelper';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';

chai.use(chaiHttp);
const expect = chai.expect;

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTestStudy'],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['QTestStudy'],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam',
  studies: ['QTestStudy'],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: ['QTestStudy'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin',
  studies: [],
});

const resultsProband1 = {
  id: 99999,
  user_id: 'qtest-proband1',
  sample_id: 'ZIFCO-1234567899',
  blood_sample_carried_out: true,
  remark: 'This is as simple comment',
};

const resultsProband2 = {
  id: 99998,
  user_id: 'qtest-proband2',
  sample_id: 'ZIFCO-1234567890',
  blood_sample_carried_out: false,
  remark: 'This is another simple comment',
};

const fetchMock = fetchMocker.sandbox();

describe('/admin/probands/{pseudonym}/bloodSamples', () => {
  const suiteSandbox = sinon.createSandbox();
  before(async function () {
    suiteSandbox.stub(LabResultImportHelper, 'importHl7FromMhhSftp');
    suiteSandbox.stub(LabResultImportHelper, 'importCsvFromHziSftp');
    suiteSandbox
      .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(() => {
    AuthServerMock.probandRealm().returnValid();
    AuthServerMock.adminRealm().returnValid();
  });

  afterEach(() => {
    fetchMock.restore();
    AuthServerMock.cleanAll();
  });

  describe('GET /admin/probands/{pseudonym}/bloodSamples', () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/bloodSamples')
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/bloodSamples')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 404 if PM tries for proband not in his study', async () => {
      fetchMock.get('express:/user/users/qtest-proband2', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy2' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband2/bloodSamples')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return http 404 if PM tries for nonexisting Proband', async () => {
      fetchMock.get('express:/user/users/NOTAPROBAND', {
        status: StatusCodes.OK,
        body: JSON.stringify(null),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/NOTAPROBAND/bloodSamples')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return blood samples from database for PM', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/bloodSamples')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.lengthOf(1);

      expect((result.body as unknown[])[0]).to.include({
        id: resultsProband1.id,
        user_id: resultsProband1.user_id,
        sample_id: resultsProband1.sample_id,
      });
    });

    it('should return blood samples from database for UT', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/bloodSamples')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.lengthOf(1);

      expect((result.body as unknown[])[0]).to.include({
        id: resultsProband1.id,
        user_id: resultsProband1.user_id,
        sample_id: resultsProband1.sample_id,
      });
    });

    it('should return blood samples from database for Forscher', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/bloodSamples')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.lengthOf(1);

      expect((result.body as unknown[])[0]).to.include({
        id: resultsProband1.id,
        user_id: resultsProband1.user_id,
        sample_id: resultsProband1.sample_id,
      });
    });

    it('should also accept pseudonyms in uppercase', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/QTest-Proband1/bloodSamples')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);
    });
  });

  describe('GET /admin/bloodResult/sample_id', () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 403 if a qtest-proband1 tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/bloodResult/' + resultsProband1.sample_id)
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/bloodResult/' + resultsProband1.sample_id)
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a UT tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/bloodResult/' + resultsProband1.sample_id)
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/bloodResult/' + resultsProband1.sample_id)
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 404 if a PM is not in same study as Proband', async () => {
      fetchMock.get('express:/user/users/qtest-proband2', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy2' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/bloodResult/' + resultsProband2.sample_id)
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return blood samples from database for PM', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/bloodResult/' + resultsProband1.sample_id)
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.OK);

      expect(result.body).to.have.lengthOf(1);
      expect((result.body as unknown[])[0]).to.include({
        id: resultsProband1.id,
        user_id: resultsProband1.user_id,
        sample_id: resultsProband1.sample_id,
        remark: resultsProband1.remark,
      });
    });
  });

  describe('GET /admin/bloodResult/{sampleId}', () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 403 if a qtest-proband1 tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/bloodResult/' + resultsProband1.sample_id)
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/bloodResult/' + resultsProband1.sample_id)
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a UT tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/bloodResult/' + resultsProband1.sample_id)
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/bloodResult/' + resultsProband1.sample_id)
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 404 if a PM is not in same study as Proband', async () => {
      fetchMock.get('express:/user/users/qtest-proband2', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy2' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/bloodResult/' + resultsProband2.sample_id)
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return blood samples from database for PM', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/bloodResult/' + resultsProband1.sample_id)
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.OK);

      expect(result.body).to.have.lengthOf(1);
      expect((result.body as unknown[])[0]).to.include({
        id: resultsProband1.id,
        user_id: resultsProband1.user_id,
        sample_id: resultsProband1.sample_id,
        remark: resultsProband1.remark,
      });
    });

    it('should also accept pseudonyms in uppercase', async () => {
      fetchMock.get('express:/user/users/QTest-Proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/bloodResult/' + resultsProband1.sample_id)
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.OK);
    });
  });

  describe('GET /admin/probands/{pseudonym}/bloodSamples/{sampleId}', () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 403 if a qtest-proband1 tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get(
          '/admin/probands/qtest-proband1/bloodSamples/' +
            resultsProband1.sample_id
        )
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get(
          '/admin/probands/qtest-proband1/bloodSamples/' +
            resultsProband1.sample_id
        )
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return blood samples from database for UT', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get(
          '/admin/probands/qtest-proband1/bloodSamples/' +
            resultsProband1.sample_id
        )
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.OK);

      expect((result.body as unknown[])[0]).to.include({
        id: resultsProband1.id,
        user_id: resultsProband1.user_id,
        sample_id: resultsProband1.sample_id,
        remark: resultsProband1.remark,
      });
    });

    it('should return blood samples from database for PM', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get(
          '/admin/probands/qtest-proband1/bloodSamples/' +
            resultsProband1.sample_id
        )
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.OK);

      expect((result.body as unknown[])[0]).to.include({
        id: resultsProband1.id,
        user_id: resultsProband1.user_id,
        sample_id: resultsProband1.sample_id,
        remark: resultsProband1.remark,
      });
    });

    it('should return blood samples from database for Forscher', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get(
          '/admin/probands/qtest-proband1/bloodSamples/' +
            resultsProband1.sample_id
        )
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);

      expect((result.body as unknown[])[0]).to.include({
        id: resultsProband1.id,
        user_id: resultsProband1.user_id,
        sample_id: resultsProband1.sample_id,
        remark: resultsProband1.remark,
      });
    });

    it('should also accept pseudonyms in uppercase', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get(
          '/admin/probands/QTest-Proband1/bloodSamples/' +
            resultsProband1.sample_id
        )
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);
    });
  });

  describe('POST /admin/probands/{pseudonym}/bloodSamples', () => {
    const validBloodSample = {
      sample_id: 'ZIFCO-1234567890',
    };

    const inValidBloodSample1 = {};

    const inValidBloodSample2 = {
      sample_id: 'ApiTest-123456789',
      wrong_param: 'something',
    };
    beforeEach(async () => {
      await setup();
    });
    afterEach(async function () {
      await cleanup();
    });

    it('should return http 403 if a Forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband1/bloodSamples')
        .set(forscherHeader1)
        .send(validBloodSample);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband1/bloodSamples')
        .set(probandHeader1)
        .send(validBloodSample);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a PM tries for Proband that is not in his study', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband2/bloodSamples')
        .set(pmHeader)
        .send(validBloodSample);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 400 if a UT tries but sample_id is missing', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband1/bloodSamples')
        .set(utHeader)
        .send(inValidBloodSample1);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return http 400 if a UT tries but blood sample has wrong params', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband1/bloodSamples')
        .set(utHeader)
        .send(inValidBloodSample2);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return http 404 if a UT tries for deleted proband', async () => {
      fetchMock.get('express:/user/users/qtest-proband3', {
        status: StatusCodes.NOT_FOUND,
      });
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband3/bloodSamples')
        .set(utHeader)
        .send(validBloodSample);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return http 200 and create the BloodSample for UT', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband1/bloodSamples')
        .set(utHeader)
        .send(validBloodSample);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.include({
        sample_id: validBloodSample.sample_id,
        user_id: 'qtest-proband1',
        blood_sample_carried_out: null,
        remark: null,
      });
    });

    it('should also accept pseudonyms in uppercase', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/QTest-Proband1/bloodSamples')
        .set(utHeader)
        .send(validBloodSample);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.include({
        sample_id: validBloodSample.sample_id,
        user_id: 'qtest-proband1',
        blood_sample_carried_out: null,
        remark: null,
      });
    });
  });

  describe('PUT /admin/probands/{pseudonym}/bloodSamples/{sampleId}', () => {
    const validBloodSampleUT1 = {
      blood_sample_carried_out: true,
    };

    const validUpdateBloodSampleUT2 = {
      remark: 'Beware of the monster under your bed!',
    };

    const validBloodSampleUT2 = {
      blood_sample_carried_out: true,
      remark: 'Beware of the monster under your bed!',
    };

    const inValidBloodSample1 = {};

    const inValidBloodSample2 = {
      remark: 'Beware of the monster under your bed!',
      blood_sample_carried_out: true,
      wrong_param: 'something',
    };

    beforeEach(async () => {
      await setup();
    });
    afterEach(async function () {
      await cleanup();
    });

    it('should return http 403 if a Forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/bloodSamples/ZIFCO-1234567899')
        .set(forscherHeader1)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a PM tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband2/bloodSamples/ZIFCO-1234567899')
        .set(pmHeader)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 404 if a UT tries for Proband that is not in his study', async () => {
      fetchMock.get('express:/user/users/qtest-proband2', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy2' }),
      });
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband2/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return http 409 if a UT tries for nonexisting blood sample', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/bloodSamples/ZIFCO-1111111111')
        .set(utHeader)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(StatusCodes.CONFLICT);
    });

    it('should return http 403 if a UT tries but update params are wrong', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(inValidBloodSample1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 400 if a UT tries but blood sample has wrong params', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(inValidBloodSample2);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return http 400 if a UT tries but proband was deleted', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband3/bloodSamples/ZIFCO-1234567891')
        .set(utHeader)
        .send(inValidBloodSample2);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return http 400 if a UT tries but proband was deactivated', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband4/bloodSamples/ZIFCO-1234567892')
        .set(utHeader)
        .send(inValidBloodSample2);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return http 200 and update blood sample blood_sample_carried_out for UT', async () => {
      fetchMock.get('express:/user/users/qtest-proband5', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband5/bloodSamples/ZIFCO-1234567898')
        .set(utHeader)
        .send(validBloodSampleUT1);
      expect(result1).to.have.status(StatusCodes.OK);
      expect(result1.body).to.include(validBloodSampleUT1);
    });

    it('should return http 409 because blood sample with blood_sample_carried_out is true already exist for UT', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(validBloodSampleUT1);
      expect(result1).to.have.status(StatusCodes.CONFLICT);
    });

    it('should return http 200 and change blood sample remark for UT', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(validUpdateBloodSampleUT2);
      expect(result1).to.have.status(StatusCodes.OK);
      expect(result1.body).to.include(validBloodSampleUT2);
    });

    it('should also accept pseudonyms in uppercase', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/admin/probands/QTest-Proband1/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(validUpdateBloodSampleUT2);
      expect(result1).to.have.status(StatusCodes.OK);
    });
  });
});
