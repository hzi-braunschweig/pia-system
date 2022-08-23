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

import { Server } from '../../src/server';
import { config } from '../../src/config';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';

import { HttpClient } from '@pia-system/lib-http-clients-internal';

import { db } from '../../src/db';

import { cleanup, setup } from './laboratoryResult.spec.data/setup.helper';
import { LabResultImportHelper } from '../../src/services/labResultImportHelper';
import { assert } from 'ts-essentials';

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
const probandHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband2',
  studies: ['QTestStudy2'],
});
const probandHeader3 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband3',
  studies: ['Teststudie'],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['QTestStudy'],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: ['QTestStudy'],
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

describe('/probands/{user_id}/labResults', () => {
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

  describe('GET /probands/{pseudonym}/labResults', () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 403 if proband tries for different proband', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/qtest-proband2/labResults')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return laboratory results from database for Proband1 without deleted ones', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/qtest-proband1/labResults')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);

      const expectedLength = 4;
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

      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      expect((result.body as unknown[])[2]).to.include({
        id: 'TEST-12349',
        user_id: resultsProband2.user_id,
      });
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      expect((result.body as unknown[])[2]).to.not.have.property(
        'lab_observations'
      );
    });

    it('should also accept pseudonyms in uppercase', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTest-Proband1/labResults')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return 403 for proband that has not complied to see labresults', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/qtest-proband2/labResults')
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });
  });

  describe('GET /probands/{pseudonym}/labResults/{resultId}', () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 403 if a proband tries for labresult that does not belong to him', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/qtest-proband2/labResults/' + resultsProband1.id)
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a proband tries that has not complied to see labresults', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/qtest-proband2/labResults/' + resultsProband3.id)
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 404 if a proband tries for labresult that was deleted', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/qtest-proband1/labResults/TEST-12348')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return http 404 if a proband tries for wrong labresult/userId combination', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/qtest-proband1/labResults/' + resultsProband3.id)
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return laboratory results from database for Proband1', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/qtest-proband1/labResults/' + resultsProband1.id)
        .set(probandHeader1);
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

    it('should return fake laboratory result for Proband1', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/qtest-proband3/labResults/TEST-3722734171')
        .set(probandHeader3);
      expect(result).to.have.status(StatusCodes.OK);

      expect(result.body).to.include({
        id: 'TEST-3722734171',
        user_id: 'qtest-proband3',
      });

      const labObservations = (result.body as { lab_observations: unknown[] })
        .lab_observations;

      expect(labObservations).to.have.lengthOf(1);

      expect(labObservations[0]).to.include({
        id: '1',
        lab_result_id: 'TEST-3722734171',
      });
    });
  });

  describe('PUT /probands/{pseudonym}/labResults/{resultId}', () => {
    const validLabResultProband1 = {
      date_of_sampling: new Date(),
      dummy_sample_id: 'TEST-1034567890',
    };

    const validLabResultProband2 = {
      date_of_sampling: new Date(),
      dummy_sample_id: 'TEST-1023456790',
    };

    const validLabResultProband3 = {
      date_of_sampling: new Date(),
      dummy_sample_id: 'TEST-1023456791',
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

    beforeEach(async () => await setup());
    afterEach(async () => await cleanup());

    it('should return http 403 if a Forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(forscherHeader1)
        .send(validLabResultProband1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a proband tries with data for pm', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send(validLabResultPM);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a Proband tries for Proband that is not himself', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/qtest-proband2/labResults/TEST-12347')
        .set(probandHeader1)
        .send(validLabResultProband2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
      expect(result.body).to.include({
        message: 'Probands can only update labresults for themself',
      });
    });

    it('should return http 403 if a Proband tries for Proband that is not himself and should not leak informations about the existence', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/qtest-proband2/labResults/DOES_NOT_EXIST')
        .set(probandHeader1)
        .send({
          date_of_sampling: new Date(),
          dummy_sample_id: 'DOES_NOT_EXIST',
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
      expect(result.body).to.include({
        message: 'Probands can only update labresults for themself',
      });
    });

    it('should return http 403 if a Proband tries that has not complied to see labresults', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/qtest-proband2/labResults/TEST-12347')
        .set(probandHeader2)
        .send(validLabResultProband2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a proband tries for nonexisting lab result', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/qtest-proband1/labResults/TEST-wrongid')
        .set(probandHeader1)
        .send(validLabResultProband1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if a proband tries but update params are wrong', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send(inValidLabResult1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 400 if a proband tries but lab result has wrong params', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send(inValidLabResult2);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return http 403 if a Proband tries for deleted lab result', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/qtest-proband1/labResults/TEST-12348')
        .set(probandHeader1)
        .send(validLabResultProband3);
      expect(result1).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if Proband tries to set the status to "new"', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send({ status: 'new' });
      expect(result1).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 403 if Proband tries to set the status to "inactive"', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send({ status: 'inactive' });
      expect(result1).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return http 200 and update lab result for Proband and set "needs_materials" field to "true"', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send(validLabResultProband1);
      expect(result1).to.have.status(StatusCodes.OK);

      AuthServerMock.probandRealm().returnValid();

      const result2 = await chai
        .request(apiAddress)
        .get('/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(probandHeader1);
      expect(result2).to.have.status(StatusCodes.OK);
      expect(result2.body).to.include({
        date_of_sampling: validLabResultProband1.date_of_sampling.toISOString(),
        dummy_sample_id: validLabResultProband1.dummy_sample_id,
        status: 'sampled',
      });

      expect(result2.body).to.not.include({
        date_of_sampling: null,
      });

      const result3 = (await db.one(
        "SELECT needs_material FROM probands WHERE pseudonym='qtest-proband1'"
      )) as unknown;
      expect(result3).to.include({
        needs_material: true,
      });
    });

    it('should also accept pseudonyms in uppercase', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTest-Proband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send(validLabResultProband1);
      expect(result1).to.have.status(StatusCodes.OK);
    });

    it('should return http 403 if a proband tries to update labresults that he updated before', async () => {
      fetchMock.get('express:/user/users/qtest-proband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      await chai
        .request(apiAddress)
        .put('/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send(validLabResultProband1);

      AuthServerMock.probandRealm().returnValid();

      const result = await chai
        .request(apiAddress)
        .put('/probands/qtest-proband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send(validLabResultProband1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });
  });

  describe('POST /probands/{pseudonym}/needsMaterial', () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should request new material for Proband "qtest-proband1" and return 204', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/qtest-proband1/needsMaterial')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
    });

    it('should also accept pseudonyms in uppercase and return 204', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTest-Proband1/needsMaterial')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
    });

    it('should return 204 Proband request the material directly after requested it first time', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/qtest-proband1/needsMaterial')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
    });

    it('should return 403 if PM requests new material for proband', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/qtest-probandenmanager/needsMaterial')
        .set(pmHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 403 if Proband tries requests new material for another proband', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/qtest-proband1/needsMaterial')
        .set(probandHeader2)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });
  });
});
