/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const sinon = require('sinon');

const JWT = require('jsonwebtoken');
const secretOrPrivateKey = require('../secretOrPrivateKey');

const { db } = require('../../src/db');
const {
  setup,
  cleanup,
} = require('./pendingPartialDeletions.spec.data/setup.helper');

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT + '/user';
const serverSandbox = sinon.createSandbox();

const testSandbox = sinon.createSandbox();
const mail = require('nodemailer');
const fetch = require('node-fetch');
const { config } = require('../../src/config');
const loggingserviceUrl = config.services.loggingservice.url;

const probandSession1 = { id: 1, role: 'Proband', username: 'ApiTestProband1' };
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'forscher1@apitest.de',
};
const forscherSession2 = {
  id: 1,
  role: 'Forscher',
  username: 'forscher2@apitest.de',
};
const forscherSession3 = {
  id: 1,
  role: 'Forscher',
  username: 'forscherNoEmail',
};
const forscherSession4 = {
  id: 1,
  role: 'Forscher',
  username: 'forscher4@apitest.de',
};
const utSession1 = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'ut1@apitest.de',
};
const sysadminSession1 = {
  id: 1,
  role: 'SysAdmin',
  username: 'sa1@apitest.de',
};
const pmSession1 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm1@apitest.de',
};

const invalidToken = JWT.sign(probandSession1, 'thisIsNotAValidPrivateKey', {
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
const forscherToken2 = JWT.sign(forscherSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken3 = JWT.sign(forscherSession3, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken4 = JWT.sign(forscherSession4, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const utToken1 = JWT.sign(utSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const sysadminToken1 = JWT.sign(sysadminSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken1 = JWT.sign(pmSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const forscherHeader1 = { authorization: forscherToken1 };
const forscherHeader2 = { authorization: forscherToken2 };
const forscherHeader3 = { authorization: forscherToken3 };
const forscherHeader4 = { authorization: forscherToken4 };
const utHeader1 = { authorization: utToken1 };
const sysadminHeader1 = { authorization: sysadminToken1 };
const pmHeader1 = { authorization: pmToken1 };

describe('/pendingPartialDeletions', function () {
  let fetchStub;
  const mailTransporter = { sendMail: sinon.stub().resolves({}) };

  before(async function () {
    serverSandbox.stub(mail, 'createTransport').returns(mailTransporter);
    await server.init();
  });

  after(async function () {
    await server.stop();
    serverSandbox.restore();
  });

  beforeEach(() => {
    fetchStub = testSandbox.stub(fetch, 'default');
    fetchStub.callsFake(async (url, options) => {
      console.log(url);
      let body;
      if (
        url === loggingserviceUrl + '/log/systemLogs' &&
        options.method === 'post'
      ) {
        body = { ...options.body };
        body.timestamp = new Date();
      } else if (
        url.startsWith(
          loggingserviceUrl + '/log/logs/ApiTestProband1?fromTime='
        )
      ) {
        body = null;
      } else {
        return new fetch.Response(null, { status: 404 });
      }
      return new fetch.Response(JSON.stringify(body));
    });
  });

  afterEach(() => {
    testSandbox.restore();
  });

  describe('GET pendingpartialdeletions/id', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingpartialdeletions/1234560')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingpartialdeletions/1234560')
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingpartialdeletions/1234560')
        .set(pmHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingpartialdeletions/1234560')
        .set(utHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingpartialdeletions/1234560')
        .set(sysadminHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries that is not involved in the deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingpartialdeletions/1234560')
        .set(forscherHeader3);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 404 when the pending deletion id does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingpartialdeletions/999999')
        .set(forscherHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 with the pending deletion for forscher who is requestedBy', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingpartialdeletions/1234560')
        .set(forscherHeader1);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234560);
      expect(result.body.requestedBy).to.equal('forscher1@apitest.de');
      expect(result.body.requestedFor).to.equal('forscher2@apitest.de');
      expect(result.body.forInstanceIds.length).to.equal(2);
      expect(result.body.forLabResultsIds.length).to.equal(2);
    });

    it('should return HTTP 200 with the pending deletion for forscher who is requestedFor', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingpartialdeletions/1234560')
        .set(forscherHeader2);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234560);
      expect(result.body.requestedBy).to.equal('forscher1@apitest.de');
      expect(result.body.requestedFor).to.equal('forscher2@apitest.de');
      expect(result.body.forInstanceIds.length).to.equal(2);
      expect(result.body.forLabResultsIds.length).to.equal(2);
    });

    it('should return HTTP 200 with the pending deletion without sample ids for forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingpartialdeletions/1234561')
        .set(forscherHeader2);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234561);
      expect(result.body.requestedBy).to.equal('forscher1@apitest.de');
      expect(result.body.requestedFor).to.equal('forscher2@apitest.de');
      expect(result.body.forInstanceIds.length).to.equal(2);
      expect(result.body.forLabResultsIds).to.equal(null);
    });

    it('should return HTTP 200 with the pending deletion without instance ids for forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingpartialdeletions/1234562')
        .set(forscherHeader2);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234562);
      expect(result.body.requestedBy).to.equal('forscher1@apitest.de');
      expect(result.body.requestedFor).to.equal('forscher2@apitest.de');
      expect(result.body.forInstanceIds).to.equal(null);
      expect(result.body.forLabResultsIds.length).to.equal(2);
    });
  });

  describe('POST pendingpartialdeletions', function () {
    beforeEach(async function () {
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    const pDValid1 = {
      requestedFor: 'forscher2@apitest.de',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'ApiTestProband1',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDValid2 = {
      requestedFor: 'forscher2@apitest.de',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'ApiTestProband1',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: null,
    };

    const pDValid3 = {
      requestedFor: 'forscher2@apitest.de',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'ApiTestProband1',
      forInstanceIds: null,
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDwrongFor = {
      requestedFor: 'nonexistingforscher@apitest.de',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'ApiTestProband1',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDNoEmailFor = {
      requestedFor: 'forscherNoEmail',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'ApiTestProband1',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDWrongStudyFor = {
      requestedFor: 'forscher4@apitest.de',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'ApiTestProband1',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDWrongStudyInstance = {
      requestedFor: 'forscher2@apitest.de',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'ApiTestProband2',
      forInstanceIds: [123456, 123458],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDWrongStudySample = {
      requestedFor: 'forscher2@apitest.de',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'ApiTestProband2',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11113'],
    };

    const pDWrongInstance = {
      requestedFor: 'forscher2@apitest.de',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'ApiTestProband1',
      forInstanceIds: [123456, 9999999],
      forLabResultsIds: ['APISAMPLE_11111', 'APISAMPLE_11112'],
    };

    const pDWrongSample = {
      requestedFor: 'forscher2@apitest.de',
      fromDate: new Date(),
      toDate: new Date(),
      probandId: 'ApiTestProband1',
      forInstanceIds: [123456, 123457],
      forLabResultsIds: ['APISAMPLE_11111', 'APINonExistingId'],
    };

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(invalidHeader)
        .send(pDValid1);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(probandHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(pmHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(utHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(sysadminHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 422 when a forscher tries for himself', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(forscherHeader2)
        .send(pDValid1);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 403 when a researcher from wrong study tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(forscherHeader4)
        .send(pDValid1);
      console.log(result.body);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 422 when requestedFor is no email address', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDNoEmailFor);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 403 when requestedFor is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDWrongStudyFor);
      console.log(result.body);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when one target instance is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDWrongStudyInstance);
      console.log(result.body);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when one target sample is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDWrongStudySample);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when one target instance is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDWrongInstance);
      console.log(result.body);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when one target sample is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDWrongSample);
      console.log(result.body);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 422 when target pm is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDwrongFor);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 200 with the created pending partial deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDValid1);
      console.log(result.body);
      expect(result).to.have.status(200);
      expect(result.body.requestedBy).to.equal('forscher1@apitest.de');
      expect(result.body.requestedFor).to.equal('forscher2@apitest.de');
      expect(result.body.forInstanceIds).to.eql([123456, 123457]);
      expect(result.body.forLabResultsIds).to.eql([
        'APISAMPLE_11111',
        'APISAMPLE_11112',
      ]);
    });

    it('should return HTTP 200 and update proband for proband pending deletion if no_email_pm requests', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(forscherHeader3)
        .send(pDValid1);
      console.log(result.body);
      expect(result).to.have.status(200);
      expect(result.body.requestedBy).to.equal('forscherNoEmail');
      expect(result.body.requestedFor).to.equal('forscher2@apitest.de');
      expect(result.body.forInstanceIds).to.eql([123456, 123457]);
      expect(result.body.forLabResultsIds).to.eql([
        'APISAMPLE_11111',
        'APISAMPLE_11112',
      ]);
    });

    it('should return HTTP 200 with the created pending partial deletion of no sample ids are set', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDValid2);
      console.log(result.body);
      expect(result).to.have.status(200);
      expect(result.body.requestedBy).to.equal('forscher1@apitest.de');
      expect(result.body.requestedFor).to.equal('forscher2@apitest.de');
      expect(result.body.forInstanceIds).to.eql([123456, 123457]);
      expect(result.body.forLabResultsIds).to.equal(null);
    });

    it('should return HTTP 200 with the created pending partial deletion if no instance ids are set', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingpartialdeletions')
        .set(forscherHeader1)
        .send(pDValid3);
      console.log(result.body);
      expect(result).to.have.status(200);
      expect(result.body.requestedBy).to.equal('forscher1@apitest.de');
      expect(result.body.requestedFor).to.equal('forscher2@apitest.de');
      expect(result.body.forInstanceIds).to.equal(null);
      expect(result.body.forLabResultsIds).to.eql([
        'APISAMPLE_11111',
        'APISAMPLE_11112',
      ]);
    });
  });

  describe('PUT pendingpartialdeletions/id', function () {
    beforeEach(async function () {
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingpartialdeletions/1234560')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingpartialdeletions/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingpartialdeletions/1234560')
        .set(pmHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingpartialdeletions/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingpartialdeletions/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if requestedBy forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingpartialdeletions/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 wrong forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingpartialdeletions/1234560')
        .set(forscherHeader4)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 and delete all of the defined data', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingpartialdeletions/1234560')
        .set(forscherHeader2)
        .send({});
      expect(result).to.have.status(200);
      expect(result.body.requestedBy).to.equal('forscher1@apitest.de');
      expect(result.body.requestedFor).to.equal('forscher2@apitest.de');
      expect(result.body.forInstanceIds).to.eql([123456, 123457]);
      expect(result.body.forLabResultsIds).to.eql([
        'APISAMPLE_11111',
        'APISAMPLE_11112',
      ]);

      const lab_observations = await db.manyOrNone(
        'SELECT * FROM lab_observations WHERE lab_result_id=ANY(SELECT id FROM lab_results WHERE user_id=$1)',
        ['ApiTestProband1']
      );
      const lab_result = await db.manyOrNone(
        'SELECT * FROM lab_results WHERE user_id=$1',
        ['ApiTestProband1']
      );
      const questionnaire_instances = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE user_id=$1',
        ['ApiTestProband1']
      );
      const questionnaire_instances_queued = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances_queued WHERE user_id=$1',
        ['ApiTestProband1']
      );
      const answers = await db.manyOrNone(
        'SELECT * FROM answers WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE user_id=$1)',
        ['ApiTestProband1']
      );
      const user_images = await db.manyOrNone(
        'SELECT * FROM user_files WHERE user_id=$1',
        ['ApiTestProband1']
      );

      expect(lab_observations.length).to.equal(0);
      expect(lab_result.length).to.equal(0);
      expect(questionnaire_instances.length).to.equal(2);
      expect(questionnaire_instances_queued.length).to.equal(0);
      expect(answers.length).to.equal(0);
      expect(user_images.length).to.equal(0);

      const deleteLogsCall = fetchStub.getCall(0);
      expect(deleteLogsCall.firstArg)
        .to.be.a('string')
        .and.satisfy((url) =>
          url.startsWith(
            loggingserviceUrl + '/log/logs/ApiTestProband1?fromTime='
          )
        );

      const logDeletionCall = fetchStub.getCall(1);
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

    it('should return HTTP 200 and delete all of the defined instances data', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingpartialdeletions/1234561')
        .set(forscherHeader2)
        .send({});
      expect(result).to.have.status(200);
      expect(result.body.requestedBy).to.equal('forscher1@apitest.de');
      expect(result.body.requestedFor).to.equal('forscher2@apitest.de');
      expect(result.body.forInstanceIds).to.eql([123456, 123457]);
      expect(result.body.forLabResultsIds).to.eql(null);

      const lab_observations = await db.manyOrNone(
        'SELECT * FROM lab_observations WHERE lab_result_id=ANY(SELECT id FROM lab_results WHERE user_id=$1)',
        ['ApiTestProband1']
      );
      const lab_result = await db.manyOrNone(
        'SELECT * FROM lab_results WHERE user_id=$1',
        ['ApiTestProband1']
      );
      const questionnaire_instances = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE user_id=$1',
        ['ApiTestProband1']
      );
      const questionnaire_instances_queued = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances_queued WHERE user_id=$1',
        ['ApiTestProband1']
      );
      const answers = await db.manyOrNone(
        'SELECT * FROM answers WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE user_id=$1)',
        ['ApiTestProband1']
      );
      const user_images = await db.manyOrNone(
        'SELECT * FROM user_files WHERE user_id=$1',
        ['ApiTestProband1']
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

    it('should return HTTP 200 and delete all of the defined lab result data', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingpartialdeletions/1234562')
        .set(forscherHeader2)
        .send({});
      expect(result).to.have.status(200);
      expect(result.body.requestedBy).to.equal('forscher1@apitest.de');
      expect(result.body.requestedFor).to.equal('forscher2@apitest.de');
      expect(result.body.forInstanceIds).to.eql(null);
      expect(result.body.forLabResultsIds).to.eql([
        'APISAMPLE_11111',
        'APISAMPLE_11112',
      ]);

      const lab_observations = await db.manyOrNone(
        'SELECT * FROM lab_observations WHERE lab_result_id=ANY(SELECT id FROM lab_results WHERE user_id=$1)',
        ['ApiTestProband1']
      );
      const lab_result = await db.manyOrNone(
        'SELECT * FROM lab_results WHERE user_id=$1',
        ['ApiTestProband1']
      );
      const questionnaire_instances = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE user_id=$1',
        ['ApiTestProband1']
      );
      const questionnaire_instances_queued = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances_queued WHERE user_id=$1',
        ['ApiTestProband1']
      );
      const answers = await db.manyOrNone(
        'SELECT * FROM answers WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE user_id=$1)',
        ['ApiTestProband1']
      );
      const user_images = await db.manyOrNone(
        'SELECT * FROM user_files WHERE user_id=$1',
        ['ApiTestProband1']
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

  describe('DELETE pendingpartialdeletions/id', function () {
    beforeEach(async function () {
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingpartialdeletions/1234560')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingpartialdeletions/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingpartialdeletions/1234560')
        .set(pmHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingpartialdeletions/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingpartialdeletions/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 wrong forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingpartialdeletions/1234560')
        .set(forscherHeader4)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 and cancel deletion of proband data for requestedBy forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingpartialdeletions/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(204);

      const pending_partial_deletion = await db.oneOrNone(
        'SELECT * FROM pending_partial_deletions WHERE id=$1',
        [1234560]
      );
      expect(pending_partial_deletion).to.equal(null);
    });

    it('should return HTTP 200 and cancel deletion of proband data for requestedFor forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingpartialdeletions/1234560')
        .set(forscherHeader2)
        .send({});
      expect(result).to.have.status(204);

      const pending_partial_deletion = await db.oneOrNone(
        'SELECT * FROM pending_partial_deletions WHERE id=$1',
        [1234560]
      );
      expect(pending_partial_deletion).to.equal(null);
    });
  });
});
