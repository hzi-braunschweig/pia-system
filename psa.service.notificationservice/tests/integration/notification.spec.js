const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const sinon = require('sinon');
const addMinutes = require('date-fns/addMinutes');

const { ListeningDbClient } = require('@pia/lib-service-core');
const fcmHelper = require('../../src/services/fcmHelper.js');

const { setup, cleanup } = require('./notification.spec.data/setup.helper');

const secretOrPrivateKey = require('../secretOrPrivateKey');
const server = require('../../src/server');

const JWT = require('jsonwebtoken');

const apiAddress = 'http://localhost:' + process.env.PORT + '/notification';

const serverSandbox = sinon.createSandbox();

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

describe('/notification', function () {
  before(async function () {
    serverSandbox.stub(ListeningDbClient.prototype);
    serverSandbox.stub(fcmHelper);
    await setup();
    await server.init();
  });

  after(async function () {
    await server.stop();
    await cleanup();
    serverSandbox.restore();
  });

  describe('POST notification', function () {
    const validNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestProband1'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const validNotificationWithTwoProbands = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestProband1', 'QTestProband4'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const validForscherNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestForscher1'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const validNotificationWithoutDate = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestProband1'],
    };

    const noTokenNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestProband2'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const noStudyNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestProband3'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const wrongUserNotification = {
      title: 'A valid Notification',
      recipients: ['TestprobandWrong'],
      body: 'A valid body',
      date: addMinutes(new Date(), 10).getTime(),
    };

    it('should return HTTP 401 if the token is invalid', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(invalidHeader)
        .send(validNotification);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(probandHeader1)
        .send(validNotification);
      expect(result).to.have.status(403);
    });

    it('should return a HTTP 200 with "success" === false', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(pmHeader)
        .send(wrongUserNotification);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: false });
    });

    it('should return HTTP 200 with "success" === false', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(pmHeader)
        .send(noStudyNotification);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: false });
    });

    it('should return HTTP 403 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(sysadminHeader)
        .send(validNotification);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 with "success" === false', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(pmHeader)
        .send(noTokenNotification);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: false });
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(forscherHeader1)
        .send(validNotification);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a UntersuchungsTeam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(utHeader)
        .send(validNotification);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 if a ProbandenManager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(pmHeader)
        .send(validNotification);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: true });
    });

    it('should return HTTP 200 when sending notification to multiple users', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(pmHeader)
        .send(validNotificationWithTwoProbands);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: true });
    });

    it('should return HTTP 403 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(sysadminHeader)
        .send(validForscherNotification);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 for a notification without a date', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(pmHeader)
        .send(validNotificationWithoutDate);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: true });
    });
  });

  describe('GET notification', function () {
    it('should return HTTP 401 if the token is invalid', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/notification/99997')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 404 if a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/notification/99997')
        .set(forscherHeader1);
      expect(result).to.have.status(404);
    });

    it('should return  HTTP 404 if another proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/notification/99997')
        .set(probandHeader2);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if QProband1 tries for non existing questionnaire instance notification', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/notification/99996')
        .set(probandHeader1);
      expect(result).to.have.status(404);
      expect(result.body.message).to.equal(
        'Could not get questionnaire instance'
      );
    });

    it('should return HTTP 200 if QProband1 tries for questionnaire notification', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/notification/99997')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.notification_type).to.equal('qReminder');
      expect(result.body.reference_id).to.equal('9999996');
      expect(result.body.questionnaire_id).to.equal(99999);
    });

    it('should return HTTP 200 if QProband1 tries for lab result notification', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/notification/99998')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.notification_type).to.equal('sample');
      expect(result.body.reference_id).to.equal('LAB_RESULT-9999999999');
      expect(result.body.title).to.equal('Neuer Laborbericht!');
    });

    it('should return HTTP 200 if QProband1 tries for custom notification', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/notification/99999')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.notification_type).to.equal('custom');
      expect(result.body.reference_id).to.equal('');
      expect(result.body.title).to.equal('I am custom title');
    });
  });
});
