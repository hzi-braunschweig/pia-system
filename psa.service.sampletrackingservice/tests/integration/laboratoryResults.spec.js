const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT + '/sample';
const sinon = require('sinon');
const testSandbox = sinon.createSandbox();
const fetchMock = require('fetch-mock').sandbox();
const fetch = require('node-fetch');

const secretOrPrivateKey = require('../secretOrPrivateKey');
const JWT = require('jsonwebtoken');
const QueryFile = require('pg-promise').QueryFile;
const path = require('path');
const { db } = require('../../src/db');

const probandSession1 = { id: 1, role: 'Proband', username: 'QTestProband1' };
const probandSession2 = { id: 1, role: 'Proband', username: 'QTestProband2' };
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
};
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam',
};
const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
};
const sysadminSession = {
  id: 1,
  role: 'SysAdmin',
  username: 'QTestSystemAdmin',
};

const invalidToken = JWT.sign(probandSession1, 'thisIsNotAValidPrivateKey', {
  algorithm: 'HS256',
  expiresIn: '24h',
});
const probandToken1 = JWT.sign(probandSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandToken2 = JWT.sign(probandSession2, secretOrPrivateKey, {
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
const probandHeader2 = { authorization: probandToken2 };
const forscherHeader1 = { authorization: forscherToken1 };
const utHeader = { authorization: utToken };
const pmHeader = { authorization: pmToken };
const sysadminHeader = { authorization: sysadminToken };

const resultsProband1 = {
  id: 'TEST-12345',
  order_id: 12345,
  dummy_sample_id: 'TEST-10345',
  user_id: 'QTestProband1',
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
  user_id: 'QTestProband1',
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
  user_id: 'QTestProband2',
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

const setupFile = new QueryFile(
  path.join(__dirname, 'laboratoryResult.spec.data/setup.sql'),
  { minify: true }
);
const cleanupFile = new QueryFile(
  path.join(__dirname, 'laboratoryResult.spec.data/cleanup.sql'),
  { minify: true }
);

describe('/sample/probands/{user_id}/labResults', () => {
  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
  });

  function mockCompliance(study, user, type, value) {
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
    testSandbox.stub(fetch, 'default').callsFake(fetchMock);
    fetchMock
      .catch(503)
      .get(
        'express:/user/users/QTestProband1/primaryStudy',
        JSON.stringify({ name: 'ApiTestStudie' })
      )
      .get(
        'express:/user/users/QTestProband2/primaryStudy',
        JSON.stringify({ name: 'ApiTestStudie2' })
      );
    mockCompliance('ApiTestStudie2', 'QTestProband2', 'labresults', false);
    mockCompliance('ApiTestStudie2', 'QTestProband2', 'samples', true);
    mockCompliance('ApiTestStudie', 'QTestProband1', 'labresults', true);
    mockCompliance('ApiTestStudie', 'QTestProband1', 'samples', true);
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET /sample/probands/{id}/labResults', async () => {
    before(async () => {
      await db.none(cleanupFile);
      await db.none(setupFile);
    });
    after(async function () {
      await db.none(cleanupFile);
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults')
        .set(sysadminHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if proband tries for different proband', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband2/labResults')
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if PM tries for proband not in his study', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband2/labResults')
        .set(pmHeader);
      expect(result).to.have.status(404);
    });

    it('should return http 404 if PM tries for nonexisting Proband', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/NOTAPROBAND/labResults')
        .set(pmHeader);
      expect(result).to.have.status(404);
    });

    it('should return laboratory results from database for Proband1 without deleted ones', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(4);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].lab_observations).to.equal(undefined);

      expect(result.body[1].id).to.equal(resultsProband2.id);
      expect(result.body[1].user_id).to.equal(resultsProband2.user_id);
      expect(result.body[1].lab_observations).to.equal(undefined);

      expect(result.body[2].id).to.equal('TEST-12349');
      expect(result.body[2].user_id).to.equal(resultsProband2.user_id);
      expect(result.body[2].lab_observations).to.equal(undefined);
    });

    it('should return 403 for proband that has not complied to see labresults', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband2/labResults')
        .set(probandHeader2);
      expect(result).to.have.status(403);
    });

    it('should return laboratory results from database for PM', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults')
        .set(pmHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(5);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].lab_observations).to.equal(undefined);

      expect(result.body[1].id).to.equal(resultsProband2.id);
      expect(result.body[1].user_id).to.equal(resultsProband2.user_id);
      expect(result.body[1].lab_observations).to.equal(undefined);
    });

    it('should return laboratory results from database for UT', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults')
        .set(utHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(5);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].lab_observations).to.equal(undefined);

      expect(result.body[1].id).to.equal(resultsProband2.id);
      expect(result.body[1].user_id).to.equal(resultsProband2.user_id);
      expect(result.body[1].lab_observations).to.equal(undefined);
    });

    it('should return laboratory results from database for Forscher', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults')
        .set(forscherHeader1);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(5);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].lab_observations).to.equal(undefined);

      expect(result.body[1].id).to.equal(resultsProband2.id);
      expect(result.body[1].user_id).to.equal(resultsProband2.user_id);
      expect(result.body[1].lab_observations).to.equal(undefined);
    });
  });

  describe('GET /sample/labResults/sample_id', async () => {
    before(async () => {
      await db.none(cleanupFile);
      await db.none(setupFile);
    });
    after(async function () {
      await db.none(cleanupFile);
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/labResults/' + resultsProband1.id)
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/labResults/' + resultsProband1.id)
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a UT tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/labResults/' + resultsProband1.id)
        .set(utHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/labResults/' + resultsProband1.id)
        .set(sysadminHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/labResults/' + resultsProband1.id)
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a PM is not in same study as Proband', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/labResults/' + resultsProband3.id)
        .set(pmHeader);
      expect(result).to.have.status(403);
    });

    it('should return laboratory result from database for ProbandenManager', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/labResults/' + resultsProband1.id)
        .set(pmHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(1);
      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
    });
  });

  describe('GET /sample/probands/{user_id}/labResults/{result_id}', async () => {
    before(async () => {
      await db.none(cleanupFile);
      await db.none(setupFile);
    });
    after(async function () {
      await db.none(cleanupFile);
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults/' + resultsProband1.id)
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a PM tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults/' + resultsProband1.id)
        .set(pmHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a UT tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults/' + resultsProband1.id)
        .set(utHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults/' + resultsProband1.id)
        .set(sysadminHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a proband tries for labresult that does not belong to him', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband2/labResults/' + resultsProband1.id)
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a proband tries that has not complied to see labresults', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband2/labResults/' + resultsProband3.id)
        .set(probandHeader2);
      expect(result).to.have.status(403);
    });

    it('should return http 404 if a proband tries for labresult that was deleted', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults/TEST-12348')
        .set(probandHeader1);
      expect(result).to.have.status(404);
    });

    it('should return http 404 if a proband tries for wrong labresult/userId combination', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults/' + resultsProband3.id)
        .set(probandHeader1);
      expect(result).to.have.status(404);
    });

    it('should return laboratory results from database for Proband1', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults/' + resultsProband1.id)
        .set(probandHeader1);
      expect(result).to.have.status(200);

      expect(result.body.id).to.equal(resultsProband1.id);
      expect(result.body.user_id).to.equal(resultsProband1.user_id);
      expect(result.body.lab_observations.length).to.equal(
        resultsProband1.lab_observations.length
      );
      expect(result.body.lab_observations[0].id).to.equal(
        resultsProband1.lab_observations[0].id
      );
      expect(result.body.lab_observations[1].id).to.equal(
        resultsProband1.lab_observations[1].id
      );
      expect(result.body.lab_observations[0].lab_result_id).to.equal(
        resultsProband1.lab_observations[0].lab_result_id
      );
      expect(result.body.lab_observations[1].lab_result_id).to.equal(
        resultsProband1.lab_observations[1].lab_result_id
      );
    });

    it('should return laboratory result from database for Forscher', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults/' + resultsProband1.id)
        .set(forscherHeader1);
      expect(result).to.have.status(200);

      expect(result.body.id).to.equal(resultsProband1.id);
      expect(result.body.user_id).to.equal(resultsProband1.user_id);
      expect(result.body.lab_observations.length).to.equal(
        resultsProband1.lab_observations.length
      );
      expect(result.body.lab_observations[0].id).to.equal(
        resultsProband1.lab_observations[0].id
      );
      expect(result.body.lab_observations[1].id).to.equal(
        resultsProband1.lab_observations[1].id
      );
      expect(result.body.lab_observations[0].lab_result_id).to.equal(
        resultsProband1.lab_observations[0].lab_result_id
      );
      expect(result.body.lab_observations[1].lab_result_id).to.equal(
        resultsProband1.lab_observations[1].lab_result_id
      );
    });

    it('should return deleted laboratory result from database for Forscher', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults/TEST-12348')
        .set(forscherHeader1);
      expect(result).to.have.status(200);

      expect(result.body.id).to.equal('TEST-12348');
      expect(result.body.user_id).to.equal('QTestProband1');
      expect(result.body.lab_observations.length).to.equal(0);
    });
  });

  describe('POST /sample/probands/id/labResults', async () => {
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
      await db.none(cleanupFile);
      await db.none(setupFile);
    });
    after(async function () {
      await db.none(cleanupFile);
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/labResults')
        .set(invalidHeader)
        .send(validLabResult);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a Forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/labResults')
        .set(forscherHeader1)
        .send(validLabResult);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/labResults')
        .set(probandHeader1)
        .send(validLabResult);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a PM tries for Proband that is not in his study', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband2/labResults')
        .set(pmHeader)
        .send(validLabResult);
      expect(result).to.have.status(403);
    });

    it('should return http 400 if a PM tries but sample_id is missing', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/labResults')
        .set(pmHeader)
        .send(inValidLabResult1);
      expect(result).to.have.status(400);
    });

    it('should return http 400 if a PM tries but lab result has wrong params', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/labResults')
        .set(pmHeader)
        .send(inValidLabResult2);
      expect(result).to.have.status(400);
    });

    it('should return http 200 and create the labresult for UT', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/labResults')
        .set(utHeader)
        .send(validLabResult);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(validLabResult.sample_id);
      expect(result.body.status).to.equal('new');
      expect(result.body.user_id).to.equal('QTestProband1');
      expect(result.body.order_id).to.equal(null);
      expect(result.body.remark).to.equal(null);
      expect(result.body.new_samples_sent).to.equal(null);
    });

    it('should return http 200 and create the labresult FOR PM', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/labResults')
        .set(pmHeader)
        .send(validLabResult2);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(validLabResult2.sample_id);
      expect(result.body.status).to.equal('new');
      expect(result.body.user_id).to.equal('QTestProband1');
      expect(result.body.order_id).to.equal(null);
      expect(result.body.remark).to.equal(null);
      expect(result.body.new_samples_sent).to.equal(false);
    });
  });

  describe('PUT /sample/probands/{user_id}/labResults/{result_id}', async () => {
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

    before(async () => {
      await db.none(cleanupFile);
      await db.none(setupFile);
    });
    after(async function () {
      await db.none(cleanupFile);
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(invalidHeader)
        .send(validLabResultProband1);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a Forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(forscherHeader1)
        .send(validLabResultProband1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a ut tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(utHeader)
        .send(validLabResultProband1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a proband tries with data for pm', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send(validLabResultPM);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a pm tries with data for proband', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send(validLabResultProband1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a PM tries for Proband that is not in his study', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband2/labResults/TEST-12347')
        .set(pmHeader)
        .send(validLabResultPM);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a PM tries for nonexisting lab result', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-wrongid')
        .set(pmHeader)
        .send(validLabResultPM);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a PM tries but update params are wrong', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send(inValidLabResult1);
      expect(result).to.have.status(403);
    });

    it('should return http 400 if a PM tries but lab result has wrong params', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send(inValidLabResult2);
      expect(result).to.have.status(400);
    });

    it('should return http 403 if a Proband tries for Proband that is not himself', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband2/labResults/TEST-12347')
        .set(probandHeader1)
        .send(validLabResultProband2);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a Proband tries that has not complied to see labresults', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband2/labResults/TEST-12347')
        .set(probandHeader2)
        .send(validLabResultProband2);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a proband tries for nonexisting lab result', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-wrongid')
        .set(probandHeader1)
        .send(validLabResultProband1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a proband tries but update params are wrong', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send(inValidLabResult1);
      expect(result).to.have.status(403);
    });

    it('should return http 400 if a proband tries but lab result has wrong params', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send(inValidLabResult2);
      expect(result).to.have.status(400);
    });

    it('should return http 403 if a PM tries for deleted lab result', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-12348')
        .set(pmHeader)
        .send(validLabResultPM);
      expect(result1).to.have.status(403);
    });

    it('should return http 403 if a Proband tries for deleted lab result', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-12348')
        .set(probandHeader1)
        .send(validLabResultProband3);
      expect(result1).to.have.status(403);
    });

    it('should return http 200 and update lab result for PM', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send(validLabResultPM);
      expect(result1).to.have.status(200);
      const result2 = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(probandHeader1);
      expect(result2).to.have.status(200);
      expect(result2.body.remark).to.equal(validLabResultPM.remark);
      expect(result2.body.new_samples_sent).to.equal(
        validLabResultPM.new_samples_sent
      );
      expect(result2.body.date_of_sampling).to.equal(null);
      expect(result2.body.status).to.equal('new');
    });

    it('should return http 200 and change lab result status to "inactive" for PM', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send({ status: 'inactive' });
      expect(result1).to.have.status(200);
      const result2 = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(probandHeader1);
      expect(result2).to.have.status(200);
      expect(result2.body.status).to.equal('inactive');
    });

    it('should return http 200 and change lab result status to "new" for PM', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send({ status: 'new' });
      expect(result1).to.have.status(200);
      const result2 = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(probandHeader1);
      expect(result2).to.have.status(200);
      expect(result2.body.status).to.equal('new');
    });

    it('should return http 400 if PM tries to set the status to "analyzed"', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send({ status: 'analyzed' });
      expect(result1).to.have.status(400);
    });

    it('should return http 400 if PM tries to set the status to "sampled"', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(pmHeader)
        .send({ status: 'sampled' });
      expect(result1).to.have.status(400);
    });

    it('should return http 403 if Proband tries to set the status to "new"', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send({ status: 'new' });
      expect(result1).to.have.status(403);
    });

    it('should return http 403 if Proband tries to set the status to "inactive"', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send({ status: 'inactive' });
      expect(result1).to.have.status(403);
    });

    it('should return http 200 and update lab result for Proband and set "needs_materials" field to "true"', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send(validLabResultProband1);
      expect(result1).to.have.status(200);
      const result2 = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(probandHeader1);
      expect(result2).to.have.status(200);
      expect(result2.body.remark).to.equal(validLabResultPM.remark);
      expect(result2.body.new_samples_sent).to.equal(
        validLabResultPM.new_samples_sent
      );
      expect(result2.body.date_of_sampling).to.not.equal(null);
      expect(result2.body.status).to.equal('sampled');
      const result3 = await db.one(
        "SELECT needs_material FROM users WHERE username='QTestProband1'"
      );
      expect(result3.needs_material).to.equal(true);
    });

    it('should return http 403 if a proband tries to update labresults that he updated before', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/labResults/TEST-1134567890')
        .set(probandHeader1)
        .send(validLabResultProband1);
      expect(result).to.have.status(403);
    });
  });

  describe('POST /sample/probands/id/needsMaterial', async () => {
    before(async () => {
      await db.none(cleanupFile);
      await db.none(setupFile);
    });
    after(async function () {
      await db.none(cleanupFile);
    });

    it('should request new material for Proband "QTestProband1" and return 204', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/needsMaterial')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(204);
    });
    it('should return 204 Proband request the material directly after requested it first time', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/needsMaterial')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(204);
    });
    it('should return 403 if PM requests new material for proband', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProbandenManager/needsMaterial')
        .set(pmHeader)
        .send({});
      expect(result).to.have.status(403);
    });
    it('should return 403 if Proband tries requests new material for another proband', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/needsMaterial')
        .set(probandHeader2)
        .send({});
      expect(result).to.have.status(403);
    });
  });
});
