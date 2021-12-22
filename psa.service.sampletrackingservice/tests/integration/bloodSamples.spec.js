/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const sinon = require('sinon');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const fetchMocker = require('fetch-mock');
const { StatusCodes } = require('http-status-codes');
const JWT = require('jsonwebtoken');

const secretOrPrivateKey = require('../secretOrPrivateKey');
const { setup, cleanup } = require('./bloodSamples.spec.data/setup.helper');
const {
  LabResultImportHelper,
} = require('../../src/services/labResultImportHelper');
const server = require('../../src/server');
const { HttpClient } = require('@pia-system/lib-http-clients-internal');

const apiAddress = 'http://localhost:' + process.env.PORT + '/sample';

const probandSession1 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband1',
  groups: ['QTestStudy'],
};
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
  groups: ['QTestStudy'],
};
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam',
  groups: ['QTestStudy'],
};
const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
  groups: ['QTestStudy'],
};
const sysadminSession = {
  id: 1,
  role: 'SysAdmin',
  username: 'QTestSystemAdmin',
  groups: [],
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
const utToken = JWT.sign(utSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken = JWT.sign(pmSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const sysadminToken = JWT.sign(sysadminSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const forscherHeader1 = { authorization: forscherToken1 };
const utHeader = { authorization: utToken };
const pmHeader = { authorization: pmToken };
const sysadminHeader = { authorization: sysadminToken };

const resultsProband1 = {
  id: 99999,
  user_id: 'QTestProband1',
  sample_id: 'ZIFCO-1234567899',
  blood_sample_carried_out: true,
  remark: 'This is as simple comment',
};

const resultsProband2 = {
  id: 99998,
  user_id: 'QTestProband2',
  sample_id: 'ZIFCO-1234567890',
  blood_sample_carried_out: false,
  remark: 'This is another simple comment',
};

const fetchMock = fetchMocker.sandbox();

describe('/sample/probands/id/bloodSamples', () => {
  const suiteSandbox = sinon.createSandbox();
  before(async function () {
    suiteSandbox.stub(LabResultImportHelper, 'importHl7FromMhhSftp');
    suiteSandbox.stub(LabResultImportHelper, 'importCsvFromHziSftp');
    suiteSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    await server.init();
  });

  after(async function () {
    await server.stop();
    suiteSandbox.restore();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  describe('GET /sample/probands/id/bloodSamples', async () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/bloodSamples')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/bloodSamples')
        .set(sysadminHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/bloodSamples')
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 404 if PM tries for proband not in his study', async () => {
      fetchMock.get('express:/user/users/QTestProband2', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy2' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband2/bloodSamples')
        .set(pmHeader);
      expect(result).to.have.status(404);
    });

    it('should return http 404 if PM tries for nonexisting Proband', async () => {
      fetchMock.get('express:/user/users/NOTAPROBAND', {
        status: StatusCodes.OK,
        body: JSON.stringify(null),
      });
      const result = await chai
        .request(apiAddress)
        .get('/probands/NOTAPROBAND/bloodSamples')
        .set(pmHeader);
      expect(result).to.have.status(404);
    });

    it('should return blood samples from database for PM', async () => {
      fetchMock.get('express:/user/users/QTestProband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/bloodSamples')
        .set(pmHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(1);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
    });

    it('should return blood samples from database for UT', async () => {
      fetchMock.get('express:/user/users/QTestProband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/bloodSamples')
        .set(utHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(1);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
    });

    it('should return blood samples from database for Forscher', async () => {
      fetchMock.get('express:/user/users/QTestProband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/bloodSamples')
        .set(forscherHeader1);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(1);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
    });
  });

  describe('GET /sample/bloodResult/sample_id', async () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a QTestProband1 tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(sysadminHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a UT tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(utHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 404 if a PM is not in same study as Proband', async () => {
      fetchMock.get('express:/user/users/QTestProband2', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy2' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband2.sample_id)
        .set(pmHeader);
      expect(result).to.have.status(404);
    });

    it('should return blood samples from database for PM', async () => {
      fetchMock.get('express:/user/users/QTestProband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(pmHeader);
      expect(result).to.have.status(200);

      expect(result.body.length).to.equal(1);
      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
      expect(result.body[0].remark).to.equal(resultsProband1.remark);
    });
  });

  describe('GET /sample/probands/id/bloodSamples/id', async () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a QTestProband1 tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(sysadminHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a UT tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(utHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 404 if a PM is not in same study as Proband', async () => {
      fetchMock.get('express:/user/users/QTestProband2', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy2' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband2.sample_id)
        .set(pmHeader);
      expect(result).to.have.status(404);
    });

    it('should return blood samples from database for PM', async () => {
      fetchMock.get('express:/user/users/QTestProband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(pmHeader);
      expect(result).to.have.status(200);

      expect(result.body.length).to.equal(1);
      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
      expect(result.body[0].remark).to.equal(resultsProband1.remark);
    });
  });

  describe('GET /sample/probands/id/bloodSamples/id', async () => {
    before(async () => {
      await setup();
    });
    after(async function () {
      await cleanup();
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .get(
          '/probands/QTestProband1/bloodSamples/' + resultsProband1.sample_id
        )
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a QTestProband1 tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get(
          '/probands/QTestProband1/bloodSamples/' + resultsProband1.sample_id
        )
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get(
          '/probands/QTestProband1/bloodSamples/' + resultsProband1.sample_id
        )
        .set(sysadminHeader);
      expect(result).to.have.status(403);
    });

    it('should return blood samples from database for UT', async () => {
      fetchMock.get('express:/user/users/QTestProband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get(
          '/probands/QTestProband1/bloodSamples/' + resultsProband1.sample_id
        )
        .set(utHeader);
      expect(result).to.have.status(200);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
      expect(result.body[0].remark).to.equal(resultsProband1.remark);
    });

    it('should return blood samples from database for PM', async () => {
      fetchMock.get('express:/user/users/QTestProband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get(
          '/probands/QTestProband1/bloodSamples/' + resultsProband1.sample_id
        )
        .set(pmHeader);
      expect(result).to.have.status(200);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
      expect(result.body[0].remark).to.equal(resultsProband1.remark);
    });

    it('should return blood samples from database for Forscher', async () => {
      fetchMock.get('express:/user/users/QTestProband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .get(
          '/probands/QTestProband1/bloodSamples/' + resultsProband1.sample_id
        )
        .set(forscherHeader1);
      expect(result).to.have.status(200);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
      expect(result.body[0].remark).to.equal(resultsProband1.remark);
    });
  });

  describe('POST /sample/probands/id/bloodSamples', async () => {
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

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/bloodSamples')
        .set(invalidHeader)
        .send(validBloodSample);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a Forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/bloodSamples')
        .set(forscherHeader1)
        .send(validBloodSample);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/bloodSamples')
        .set(probandHeader1)
        .send(validBloodSample);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a PM tries for Proband that is not in his study', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband2/bloodSamples')
        .set(pmHeader)
        .send(validBloodSample);
      expect(result).to.have.status(403);
    });

    it('should return http 400 if a UT tries but sample_id is missing', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/bloodSamples')
        .set(pmHeader)
        .send(inValidBloodSample1);
      expect(result).to.have.status(400);
    });

    it('should return http 400 if a UT tries but blood sample has wrong params', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/bloodSamples')
        .set(pmHeader)
        .send(inValidBloodSample2);
      expect(result).to.have.status(400);
    });

    it('should return http 403 if a UT tries for deleted proband', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband3/bloodSamples')
        .set(pmHeader)
        .send(validBloodSample);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a UT tries for deactivated proband', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband4/bloodSamples')
        .set(pmHeader)
        .send(validBloodSample);
      expect(result).to.have.status(403);
    });

    it('should return http 200 and create the BloodSample for UT', async () => {
      fetchMock.get('express:/user/users/QTestProband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/bloodSamples')
        .set(utHeader)
        .send(validBloodSample);
      expect(result).to.have.status(200);
      expect(result.body.sample_id).to.equal(validBloodSample.sample_id);
      expect(result.body.user_id).to.equal('QTestProband1');
      expect(result.body.blood_sample_carried_out).to.equal(null);
      expect(result.body.remark).to.equal(null);
    });
  });

  describe('PUT /sample/probands/id/bloodSamples/id', async () => {
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

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1234567899')
        .set(invalidHeader)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a Forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1234567899')
        .set(forscherHeader1)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a PM tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband2/bloodSamples/ZIFCO-1234567899')
        .set(pmHeader)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(403);
    });

    it('should return http 404 if a UT tries for Proband that is not in his study', async () => {
      fetchMock.get('express:/user/users/QTestProband2', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy2' }),
      });
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband2/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(404);
    });

    it('should return http 409 if a UT tries for nonexisting blood sample', async () => {
      fetchMock.get('express:/user/users/QTestProband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1111111111')
        .set(utHeader)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(409);
    });

    it('should return http 403 if a UT tries but update params are wrong', async () => {
      fetchMock.get('express:/user/users/QTestProband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(inValidBloodSample1);
      expect(result).to.have.status(403);
    });

    it('should return http 400 if a UT tries but blood sample has wrong params', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(inValidBloodSample2);
      expect(result).to.have.status(400);
    });

    it('should return http 400 if a UT tries but proband was deleted', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband3/bloodSamples/ZIFCO-1234567891')
        .set(utHeader)
        .send(inValidBloodSample2);
      expect(result).to.have.status(400);
    });

    it('should return http 400 if a UT tries but proband was deactivated', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband4/bloodSamples/ZIFCO-1234567892')
        .set(utHeader)
        .send(inValidBloodSample2);
      expect(result).to.have.status(400);
    });

    it('should return http 200 and update blood sample blood_sample_carried_out for UT', async () => {
      fetchMock.get('express:/user/users/QTestProband5', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband5/bloodSamples/ZIFCO-1234567898')
        .set(utHeader)
        .send(validBloodSampleUT1);
      expect(result1).to.have.status(200);
      expect(result1.body.blood_sample_carried_out).to.equal(
        validBloodSampleUT1.blood_sample_carried_out
      );
    });

    it('should return http 409 because blood sample with blood_sample_carried_out is true already exist for UT', async () => {
      fetchMock.get('express:/user/users/QTestProband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(validBloodSampleUT1);
      expect(result1).to.have.status(409);
    });

    it('should return http 200 and change blood sample remark for UT', async () => {
      fetchMock.get('express:/user/users/QTestProband1', {
        status: StatusCodes.OK,
        body: JSON.stringify({ study: 'QTestStudy' }),
      });
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(validUpdateBloodSampleUT2);
      expect(result1).to.have.status(200);
      expect(result1.body.remark).to.equal(validBloodSampleUT2.remark);
      expect(result1.body.blood_sample_carried_out).to.equal(
        validBloodSampleUT2.blood_sample_carried_out
      );
    });
  });
});
