/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';

import fetchMocker from 'fetch-mock';

import { StatusCodes } from 'http-status-codes';

import { Server } from '../../src/server';
import { config } from '../../src/config';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';

import { HttpClient } from '@pia-system/lib-http-clients-internal';

import { cleanup, setup } from './laboratoryResult.spec.data/setup.helper';
import { LabResultImportHelper } from '../../src/services/labResultImportHelper';
import { assert } from 'ts-essentials';
import { getRepository } from 'typeorm';
import { LabResultTemplate } from '../../src/entities/labResultTemplate';

chai.use(chaiHttp);
const expect = chai.expect;

const apiAddress = `http://localhost:${config.public.port}`;

const testSandbox = sinon.createSandbox();
const fetchMock = fetchMocker.sandbox();

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
const forscherHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: [],
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
  id: 'TEST-12345',
  order_id: 12345,
  dummy_sample_id: 'TEST-10345',
  user_id: 'qtest-proband1',
  date_of_sampling: new Date(),
  status: 'analyzed',
  remark: 'Nothing to note here',
  new_samples_sent: false,
  performing_doctor: '',
  study_status: null,
  lab_observations: [
    {
      id: 9999991,
      lab_result_id: 'TEST-12345',
      name_id: 12345,
      name: 'Adenovirus-PCR (resp.)',
      result_value: null,
      comment: 'This is as simple comment',
      date_of_analysis: new Date(),
      date_of_delivery: new Date(),
      date_of_announcement: new Date(),
      lab_name: 'MHH',
      material: 'Nasenabstrich',
      result_string: 'negativ',
      unit: null,
      other_unit: null,
      kit_name: null,
    },
    {
      id: 9999992,
      lab_result_id: 'TEST-12345',
      name_id: 12345,
      name: 'Adenovirus-PCR (resp.)',
      result_value: null,
      comment: 'This is as simple comment',
      date_of_analysis: new Date(),
      date_of_delivery: new Date(),
      date_of_announcement: new Date(),
      lab_name: 'MHH',
      material: 'Nasenabstrich',
      result_string: 'negativ',
      unit: null,
      other_unit: null,
      kit_name: null,
    },
  ],
};

const resultsProband2 = {
  id: 'TEST-12346',
  order_id: 12346,
  dummy_sample_id: 'TEST-10346',
  user_id: 'qtest-proband1',
  date_of_sampling: new Date(),
  status: 'analyzed',
  remark: 'Nothing to note here',
  new_samples_sent: false,
  performing_doctor: 'Dr Who',
  study_status: null,
  lab_observations: [
    {
      id: 9999993,
      lab_result_id: 'TEST-12346',
      name_id: 12345,
      name: 'Adenovirus-PCR (resp.)',
      result_value: 30,
      comment: 'Another comment',
      date_of_analysis: new Date(),
      date_of_delivery: new Date(),
      date_of_announcement: new Date(),
      lab_name: 'MHH',
      material: 'Nasenabstrich',
      result_string: 'positiv',
      unit: null,
      other_unit: null,
      kit_name: null,
    },
    {
      id: 9999994,
      lab_result_id: 'TEST-12346',
      name_id: 12345,
      name: 'Adenovirus-PCR (resp.)',
      result_value: null,
      comment: 'Another comment',
      date_of_analysis: new Date(),
      date_of_delivery: new Date(),
      date_of_announcement: new Date(),
      lab_name: 'MHH',
      material: 'Nasenabstrich',
      result_string: 'negativ',
      unit: null,
      other_unit: null,
      kit_name: null,
    },
  ],
};

const resultsProband3 = {
  id: 'TEST-12347',
  order_id: 12346,
  dummy_sample_id: 'TEST-10347',
  user_id: 'qtest-proband2',
  date_of_sampling: new Date(),
  status: 'analyzed',
  remark: 'Nothing to note here',
  new_samples_sent: false,
  performing_doctor: 'Dr Who',
  study_status: null,
  lab_observations: [
    {
      id: 9999995,
      lab_result_id: 'TEST-12347',
      name_id: 12345,
      name: 'Adenovirus-PCR (resp.)',
      result_value: 30,
      comment: 'Another comment',
      date_of_analysis: new Date(),
      date_of_delivery: new Date(),
      date_of_announcement: new Date(),
      lab_name: 'MHH',
      material: 'Nasenabstrich',
      result_string: 'positiv',
      unit: null,
      other_unit: null,
      kit_name: null,
    },
    {
      id: 9999996,
      lab_result_id: 'TEST-12347',
      name_id: 12345,
      name: 'Adenovirus-PCR (resp.)',
      result_value: null,
      comment: 'Another comment',
      date_of_analysis: new Date(),
      date_of_delivery: new Date(),
      date_of_announcement: new Date(),
      lab_name: 'MHH',
      material: 'Nasenabstrich',
      result_string: 'negativ',
      unit: null,
      other_unit: null,
      kit_name: null,
    },
  ],
};

describe('/admin/probands/{pseudonym}/labResults', () => {
  const suiteSandbox = sinon.createSandbox();
  before(async function () {
    suiteSandbox.stub(LabResultImportHelper, 'importHl7FromMhhSftp');
    suiteSandbox.stub(LabResultImportHelper, 'importCsvFromHziSftp');
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    suiteSandbox.restore();
  });

  function mockCompliance(
    study: string,
    user: string,
    type: string,
    value: unknown
  ): void {
    fetchMock.get(
      {
        url: 'express:/compliance/:study/agree/:user',
        params: { study, user },
        query: { system: type },
        name: study + user + type,
      },
      String(value)
    );
  }

  beforeEach(() => {
    testSandbox
      .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);
    mockCompliance('QTestStudy2', 'qtest-proband2', 'labresults', false);
    mockCompliance('QTestStudy2', 'qtest-proband2', 'samples', true);
    mockCompliance('QTestStudy', 'qtest-proband1', 'labresults', true);
    mockCompliance('QTestStudy', 'qtest-proband1', 'samples', true);
    mockCompliance('Teststudie', 'qtest-proband3', 'labresults', true);

    AuthServerMock.probandRealm().returnValid();
    AuthServerMock.adminRealm().returnValid();
  });

  afterEach(() => {
    AuthServerMock.cleanAll();
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET /admin/probands/{pseudonym}/labResults', () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/labResults')
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/labResults')
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
        .get('/admin/probands/qtest-proband2/labResults')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return http 404 if PM tries for nonexistent Proband', async () => {
      fetchMock.get('express:/user/users/NOTAPROBAND', {
        status: StatusCodes.OK,
        body: JSON.stringify(null),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/NOTAPROBAND/labResults')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return laboratory results from database for PM', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/labResults')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.OK);

      const expectedLength = 5;
      expect(result.body).to.have.lengthOf(expectedLength);

      expect((result.body as unknown[])[0]).to.include({
        id: resultsProband1.id,
        user_id: resultsProband1.user_id,
      });
      expect((result.body as unknown[])[0]).to.not.have.property(
        'lab_observations'
      );

      expect((result.body as unknown[])[1]).to.include({
        id: resultsProband2.id,
        user_id: resultsProband2.user_id,
      });
      expect((result.body as unknown[])[1]).to.not.have.property(
        'lab_observations'
      );
    });

    it('should return laboratory results from database for UT', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/labResults')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.OK);

      const expectedLength = 5;
      expect(result.body).to.have.lengthOf(expectedLength);

      expect((result.body as unknown[])[0]).to.include({
        id: resultsProband1.id,
        user_id: resultsProband1.user_id,
      });
      expect((result.body as unknown[])[0]).to.not.have.property(
        'lab_observations'
      );

      expect((result.body as unknown[])[1]).to.include({
        id: resultsProband2.id,
        user_id: resultsProband2.user_id,
      });
      expect((result.body as unknown[])[1]).to.not.have.property(
        'lab_observations'
      );
    });

    it('should return laboratory results from database for Forscher', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/labResults')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);

      const expectedLength = 5;
      expect(result.body).to.have.lengthOf(expectedLength);

      expect((result.body as unknown[])[0]).to.include({
        id: resultsProband1.id,
        user_id: resultsProband1.user_id,
      });
      expect((result.body as unknown[])[0]).to.not.have.property(
        'lab_observations'
      );

      expect((result.body as unknown[])[1]).to.include({
        id: resultsProband2.id,
        user_id: resultsProband2.user_id,
      });
      expect((result.body as unknown[])[1]).to.not.have.property(
        'lab_observations'
      );
    });

    it('should also accept pseudonyms in uppercase', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/QTest-Proband1/labResults')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);
    });
  });

  describe('GET /admin/labResults/{sampleId}', () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 403 if a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/labResults/' + resultsProband1.id)
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a UT tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/labResults/' + resultsProband1.id)
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/labResults/' + resultsProband1.id)
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/labResults/' + resultsProband1.id)
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 404 if a PM is not in same study as Proband', async () => {
      fetchMock.get('express:/user/users/qtest-proband2', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy2' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/labResults/' + resultsProband3.id)
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return laboratory result from database for ProbandenManager', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/labResults/' + resultsProband1.id)
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.include({
        id: resultsProband1.id,
        user_id: resultsProband1.user_id,
      });
    });
  });

  describe('GET /admin/probands/{pseudonym}/labResults/{resultId}', () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 403 if a PM tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/labResults/' + resultsProband1.id)
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a UT tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/labResults/' + resultsProband1.id)
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/labResults/' + resultsProband1.id)
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/labResults/' + resultsProband1.id)
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return laboratory result from database for Forscher', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/labResults/' + resultsProband1.id)
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);

      expect(result.body).to.include({
        id: resultsProband1.id,
        user_id: resultsProband1.user_id,
      });

      const labObservations = (result.body as { lab_observations: unknown[] })
        .lab_observations;

      expect(labObservations).to.have.lengthOf(
        resultsProband1.lab_observations.length
      );

      assert(resultsProband1.lab_observations[0]);
      assert(resultsProband1.lab_observations[1]);

      expect(labObservations[0]).to.include({
        id: resultsProband1.lab_observations[0].id,
        lab_result_id: resultsProband1.lab_observations[0].lab_result_id,
      });

      expect(labObservations[1]).to.include({
        id: resultsProband1.lab_observations[1].id,
        lab_result_id: resultsProband1.lab_observations[1].lab_result_id,
      });
    });

    it('should return deleted laboratory result from database for Forscher', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/qtest-proband1/labResults/TEST-12348')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);

      expect(result.body).to.include({
        id: 'TEST-12348',
        user_id: 'qtest-proband1',
      });

      const labObservations = (result.body as { lab_observations: unknown[] })
        .lab_observations;

      expect(labObservations).to.have.lengthOf(0);
    });

    it('should also accept pseudonyms in uppercase', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/admin/probands/QTest-Proband1/labResults/TEST-12348')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.include({
        id: 'TEST-12348',
        user_id: 'qtest-proband1',
      });
    });
  });

  describe('GET /admin/studies/{studyName}/labResultTemplate', () => {
    const route = '/admin/studies/QTestStudy/labResultTemplate';

    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 403 if a Proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get(route)
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a pm tries', async () => {
      const result = await chai.request(apiAddress).get(route).set(pmHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 200 and the corresponding template if a Forscher tries', async () => {
      const result1 = await chai
        .request(apiAddress)
        .get(route)
        .set(forscherHeader1);
      expect(result1).to.have.status(StatusCodes.OK);

      expect(result1.body).to.deep.equal({ markdownText: 'setup markdown' });
    });

    it('should return http 200 and a default template if a Forscher tries and no template for the study is stored in the db', async () => {
      await getRepository(LabResultTemplate).delete({ study: 'QTestStudy' });

      const result1 = await chai
        .request(apiAddress)
        .get(route)
        .set(forscherHeader1);
      expect(result1).to.have.status(StatusCodes.OK);

      const markdownText = result1.body.markdownText;

      expect(markdownText).to.include('Institut für Virologie');
    });
  });

  describe('POST /admin/probands/id/labResults', () => {
    const validLabResult = {
      sample_id: 'TEST-1134567891',
      new_samples_sent: null,
    };

    const validLabResult2 = {
      sample_id: 'TEST-1134567892',
      new_samples_sent: false,
    };

    const inValidLabResult1 = {};

    const inValidLabResult2 = {
      sample_id: 'TEST-1134567890',
      wrong_param: 'something',
    };

    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 403 if a Forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband1/labResults')
        .set(forscherHeader1)
        .send(validLabResult);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband1/labResults')
        .set(probandHeader1)
        .send(validLabResult);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 404 if a PM tries for Proband that is not in his study', async () => {
      fetchMock.get('express:/user/users/qtest-proband2', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy2' }),
      });
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband2/labResults')
        .set(pmHeader)
        .send(validLabResult);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return http 400 if a PM tries but sample_id is missing', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband1/labResults')
        .set(pmHeader)
        .send(inValidLabResult1);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return http 400 if a PM tries but lab result has wrong params', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband1/labResults')
        .set(pmHeader)
        .send(inValidLabResult2);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return http 200 and create the labresult for UT', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband1/labResults')
        .set(utHeader)
        .send(validLabResult);
      expect(result, result.text).to.have.status(StatusCodes.OK);

      expect(result.body).to.include({
        id: validLabResult.sample_id,
        status: 'new',
        user_id: 'qtest-proband1',
        order_id: null,
        remark: null,
        new_samples_sent: null,
      });
    });

    it('should return http 200 and create the labresult FOR PM', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .post('/admin/probands/qtest-proband1/labResults')
        .set(pmHeader)
        .send(validLabResult2);
      expect(result, result.text).to.have.status(StatusCodes.OK);

      expect(result.body).to.include({
        id: validLabResult2.sample_id,
        status: 'new',
        user_id: 'qtest-proband1',
        order_id: null,
        remark: null,
        new_samples_sent: false,
      });
    });
  });

  describe('PUT /admin/probands/{pseudonym}/labResults/{resultId}', () => {
    const validLabResultProband1 = {
      date_of_sampling: new Date(),
      dummy_sample_id: 'TEST-1034567890',
    };

    const validLabResultPM = {
      remark: 'Beware of the monster under your bed!',
      new_samples_sent: true,
    };

    const inValidLabResult1 = {};

    const inValidLabResult2 = {
      remark: 'Beware of the monster under your bed!',
      new_samples_sent: true,
      date_of_sampling: new Date(),
      wrong_param: 'something',
    };

    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 403 if a Forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(forscherHeader1)
        .send(validLabResultProband1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send(validLabResultPM);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a pm tries with data for proband', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send(validLabResultProband1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 404 if a PM tries for Proband that is not in his study', async () => {
      fetchMock.get('express:/user/users/qtest-proband2', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy2' }),
      });
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband2/labResults/TEST-12347')
        .set(pmHeader)
        .send(validLabResultPM);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return http 403 if a PM tries for nonexisting lab result', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/labResults/TEST-wrongid')
        .set(pmHeader)
        .send(validLabResultPM);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a PM tries but update params are wrong', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send(inValidLabResult1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 400 if a PM tries but lab result has wrong params', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send(inValidLabResult2);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return http 403 if a PM tries for deleted lab result', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/labResults/TEST-12348')
        .set(pmHeader)
        .send(validLabResultPM);
      expect(result1).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 200 and update lab result for PM', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send(validLabResultPM);
      expect(result1).to.have.status(StatusCodes.OK);

      AuthServerMock.probandRealm().returnValid();

      const result2 = await chai
        .request(apiAddress)
        .get('/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(probandHeader1);
      expect(result2).to.have.status(StatusCodes.OK);

      expect(result2.body).to.include({
        remark: validLabResultPM.remark,
        new_samples_sent: validLabResultPM.new_samples_sent,
        date_of_sampling: null,
        status: 'new',
      });
    });

    it('should return http 200 and change lab result status to "inactive" for PM', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send({ status: 'inactive' });
      expect(result1).to.have.status(StatusCodes.OK);

      AuthServerMock.probandRealm().returnValid();

      const result2 = await chai
        .request(apiAddress)
        .get('/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(probandHeader1);
      expect(result2).to.have.status(StatusCodes.OK);
      expect(result2.body).to.include({
        status: 'inactive',
      });
    });

    it('should return http 200 and change lab result status to "new" for PM', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send({ status: 'new' });
      expect(result1).to.have.status(StatusCodes.OK);

      AuthServerMock.probandRealm().returnValid();

      const result2 = await chai
        .request(apiAddress)
        .get('/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(probandHeader1);
      expect(result2).to.have.status(StatusCodes.OK);
      expect(result2.body).to.include({
        status: 'new',
      });
    });

    it('should also accept pseudonyms in uppercase', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/admin/probands/QTest-Proband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send({ status: 'new' });
      expect(result1).to.have.status(StatusCodes.OK);
    });

    it('should return http 400 if PM tries to set the status to "analyzed"', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send({ status: 'analyzed' });
      expect(result1).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return http 400 if PM tries to set the status to "sampled"', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/admin/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send({ status: 'sampled' });
      expect(result1).to.have.status(StatusCodes.BAD_REQUEST);
    });
  });

  describe('PUT /admin/studies/{studyName}/labResultTemplate', () => {
    const validLabResultTemplate = {
      markdownText: 'Test template',
    };

    const validLabResultTemplate2 = {
      markdownText: 'Test template 2',
    };

    const invalidLabResultTemplate = {
      invalidAttribute: 'Test',
    };

    const route = '/admin/studies/QTestStudy/labResultTemplate';

    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 403 if a Proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put(route)
        .set(probandHeader1)
        .send(validLabResultTemplate);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a pm tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put(route)
        .set(pmHeader)
        .send(validLabResultTemplate);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a Forscher tries but is not approved for the study', async () => {
      const result = await chai
        .request(apiAddress)
        .put(route)
        .set(forscherHeader2)
        .send(validLabResultTemplate);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 400 if a Forscher tries but data is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .put(route)
        .set(forscherHeader1)
        .send(invalidLabResultTemplate);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return http 200 if a Forscher tries with valid data', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put(route)
        .set(forscherHeader1)
        .send(validLabResultTemplate);
      expect(result1).to.have.status(StatusCodes.OK);
    });

    it('should return http 200 if a Forscher tries with valid data and update the template', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put(route)
        .set(forscherHeader1)
        .send(validLabResultTemplate2);
      expect(result1).to.have.status(StatusCodes.OK);

      AuthServerMock.adminRealm().returnValid();

      const result2 = await chai
        .request(apiAddress)
        .get(route)
        .set(forscherHeader1);

      console.log(result2);
      expect(result2).to.have.status(StatusCodes.OK);

      expect(result2.body).to.deep.equal(validLabResultTemplate2);
    });
  });
});
