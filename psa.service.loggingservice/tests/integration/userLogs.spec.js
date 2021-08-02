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

const secretOrPrivateKey = require('../secretOrPrivateKey');
const JWT = require('jsonwebtoken');

const server = require('../../src/server');
const apiEndpoint = 'http://localhost:' + process.env.PORT + '/log';

const { db } = require('../../src/db');
const { setupFile, cleanupFile } = require('./userLogs.spec.data/sqlFiles');

const testSandbox = sinon.createSandbox();
const fetch = require('node-fetch');
const { config } = require('../../src/config');

const userserviceInternal = config.services.userservice;
const userserviceUrl = `${userserviceInternal.protocol}://${userserviceInternal.host}:${userserviceInternal.port}`;

const probandSession1 = { id: 1, role: 'Proband', username: 'QTestProband1' };
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

describe('/log/logs', () => {
  let fetchStub;

  before(async () => {
    await server.init();
  });

  after(async () => {
    await server.stop();
  });

  beforeEach(() => {
    fetchStub = testSandbox.stub(fetch, 'default');
    fetchStub.callsFake(async (url) => {
      console.log(url);
      let body;
      if (
        url ===
        userserviceUrl + '/user/professional/QTestForscher1/allProbands'
      ) {
        body = ['QTestProband1', 'QTestProband3'];
      } else {
        return new fetch.Response(null, { status: 404 });
      }
      return new fetch.Response(JSON.stringify(body));
    });
  });

  afterEach(() => {
    testSandbox.restore();
  });

  // The GET requests may have a very long URI therefore
  // a POST method type was used in the tests order to send the parameters as payload
  describe('GET /log/logs', async () => {
    before(async () => {
      await db.none(cleanupFile);
      await db.none(setupFile);
    });

    after(async function () {
      await db.none(cleanupFile);
    });

    it('should return 401 if the token is invalid', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(invalidHeader)
        .send({ probands: ['QTestProband1'] });
      expect(result).to.have.status(401);
    });

    it('should return 403 if PM tries', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(pmHeader)
        .send({ probands: ['QTestProband1'] });
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a UT tries', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(utHeader)
        .send({ probands: ['QTestProband1'] });
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(sysadminHeader)
        .send({ probands: ['QTestProband1'] });
      expect(result).to.have.status(403);
    });

    it('should return http 403 if proband tries', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(probandHeader1)
        .send({ probands: ['QTestProband1'] });
      expect(result).to.have.status(403);
    });

    it('should return http 200 if "Forscher" tries', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({ probands: ['QTestProband1'] });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array');
    });

    it('should return 200 and empty list if Forscher tries to access logs for Proband who is not in his study', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({ probands: ['QTestProband2'] });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.empty;
    });

    it('should return 200 and list with all logs', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.not.empty;
    });

    it('should return 200 and list with all logs on interval ', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({ fromTime: '2018-11-21', toTime: '2019-11-22' });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.not.empty;
      expect(result.body).to.lengthOf(40);
    });

    it('should return 200 and list with all logs on interval from 21.11.2010 and 22.11.2013', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({ fromTime: '2010-11-21', toTime: '2013-11-22' });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.not.empty;
      expect(result.body).to.lengthOf(5);
    });

    it('should return 200 and list with all logs on interval from 21.11.2010 and 22.11.2013 for QTestProband3', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({
          probands: ['QTestProband3'],
          fromTime: '2010-11-21',
          toTime: '2013-11-22',
        });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.not.empty;
      expect(result.body).to.lengthOf(2);
    });

    it('should return 200 and list with all logs on interval from 21.11.2010 and 22.11.2013 for QTestProband3 and QTestProband1', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({
          probands: ['QTestProband3', 'QTestProband1'],
          fromTime: '2010-11-21',
          toTime: '2013-11-22',
        });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.not.empty;
      expect(result.body).to.lengthOf(5);
    });

    it('should return 200 and list with all logs on interval from 21.11.2010 and 22.11.2013 for QTestProband3', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({
          probands: ['QTestProband3', 'QTestProband2'],
          fromTime: '2010-11-21',
          toTime: '2013-11-22',
        });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.not.empty;
      expect(result.body).to.lengthOf(2);
    });

    it('should return 200 and empty list for QTestProband2', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({
          probands: ['QTestProband2'],
          fromTime: '2010-11-21',
          toTime: '2013-11-22',
        });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.empty;
    });

    it('should return 200 and list with all logs beginning from 21.11.2010', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({ fromTime: '2010-11-21' });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.not.empty;
      expect(result.body).to.lengthOf(45);
    });

    it('should return 200 and list with all logs of type "login"', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({ activities: ['login'] });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.not.empty;
      expect(result.body).to.lengthOf(15);
    });

    it('should return 200 and list with all logs of type "login" and "logout"', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({ activities: ['login', 'logout'] });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.not.empty;
      expect(result.body).to.lengthOf(35);
    });

    it('should return 200 and list with all logs of type "login"', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({ activities: ['login'] });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.not.empty;
      expect(result.body).to.lengthOf(15);
    });

    it('should return 200 and list with all logs on interval from 21.11.2010 and 22.11.2013 for QTestProband3 and QTestProband1', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({
          activities: ['login'],
          probands: ['QTestProband3', 'QTestProband1'],
          fromTime: '2010-11-21',
          toTime: '2013-11-22',
        });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.not.empty;
      expect(result.body).to.lengthOf(5);
    });

    it('should return 200 and empty list for logs on interval from 21.11.2010 and 22.11.2013 for QTestProband3 and QTestProband1 of type logout', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({
          activities: ['logout'],
          probands: ['QTestProband3', 'QTestProband1'],
          fromTime: '2010-11-21',
          toTime: '2013-11-22',
        });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.empty;
    });

    it('should return 200 and list of logs for questionnaireID 1', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({ questionnaires: ['1'] });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.not.empty;
      expect(result.body).to.lengthOf(10);
    });

    it('should return 200 and list of logs for ', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({ questionnaires: ['1'], activities: ['q_released_once'] });
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array').that.is.not.empty;
      expect(result.body).to.lengthOf(10);
    });

    it('should return 200 and list of logs for all activities for questionnaire with id 1 or activity from type "login" for Probands  ', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({ questionnaires: ['1'], activities: ['login'] });
      expect(result).to.have.status(200);
      expect(result.body).to.lengthOf(25);
    });

    it('should return 200 and list of logs for ', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({
          questionnaires: ['1'],
          activities: ['login', 'q_released_once'],
        });
      expect(result).to.have.status(200);
      expect(result.body).to.lengthOf(25);
    });

    it('should return 200 and list of logs for ', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({
          questionnaires: ['1'],
          activities: ['login', 'q_released_twice'],
        });
      expect(result).to.have.status(200);
      expect(result.body).to.lengthOf(15);
    });

    it('should return 200 and list of logs for ', async () => {
      const result = await chai
        .request(apiEndpoint)
        .post('/logs')
        .set(forscherHeader1)
        .send({
          questionnaires: ['1'],
          activities: ['login', 'q_released_twice'],
        });
      expect(result).to.have.status(200);
      expect(result.body).to.lengthOf(15);
    });
  });
});
