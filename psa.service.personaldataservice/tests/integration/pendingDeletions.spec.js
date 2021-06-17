const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const sinon = require('sinon');
const fetchMock = require('fetch-mock').sandbox();
const fetch = require('node-fetch');
const mail = require('nodemailer');

const { db } = require('../../src/db');
const { setup, cleanup } = require('./pendingDeletions.spec.data/setup.helper');

const secretOrPrivateKey = require('../secretOrPrivateKey');
const server = require('../../src/server');

const serverSandbox = sinon.createSandbox();
const testSandbox = sinon.createSandbox();

const JWT = require('jsonwebtoken');

const apiAddress = 'http://localhost:' + process.env.PORT + '/personal';

const probandSession1 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband1',
  groups: ['QTestStudy1'],
};
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'forscher1@example.com',
  groups: ['QTestStudy1'],
};
const utSession1 = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'ut1@example.com',
  groups: ['QTestStudy1'],
};
const sysadminSession1 = {
  id: 1,
  role: 'SysAdmin',
  username: 'sa1@example.com',
  groups: [],
};
const pmSession1 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm1@example.com',
  groups: ['QTestStudy1'],
};
const pmSession2 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm2@example.com',
  groups: ['QTestStudy1'],
};
const pmSession3 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pmNoEmail',
  groups: ['QTestStudy1'],
};
const pmSession4 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm4@example.com',
  groups: ['QTestStudy1'],
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
const pmToken2 = JWT.sign(pmSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken3 = JWT.sign(pmSession3, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken4 = JWT.sign(pmSession4, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const forscherHeader1 = { authorization: forscherToken1 };
const utHeader1 = { authorization: utToken1 };
const sysadminHeader1 = { authorization: sysadminToken1 };
const pmHeader1 = { authorization: pmToken1 };
const pmHeader2 = { authorization: pmToken2 };
const pmHeader3 = { authorization: pmToken3 };
const pmHeader4 = { authorization: pmToken4 };

describe('/pendingDeletions', function () {
  const mailTransporterMock = {
    sendMail: serverSandbox.stub().resolves(),
  };
  before(async function () {
    serverSandbox.stub(mail, 'createTransport').returns(mailTransporterMock);
    await server.init();
  });

  after(async function () {
    await server.stop();
    serverSandbox.restore();
  });

  beforeEach(async () => {
    testSandbox.stub(fetch, 'default').callsFake(fetchMock);
    fetchMock
      .catch(503)
      .patch('express:/auth/user', 204, { name: 'setAccountStatus' });
    await setup();
  });

  afterEach(async function () {
    testSandbox.restore();
    fetchMock.restore();
    await cleanup();
  });

  describe('GET /pendingdeletions/proband_id', function () {
    it('should return HTTP 401 when the token is wrong', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/QTestProband1')
        .set(invalidHeader);
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/QTestProband1')
        .set(probandHeader1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/QTestProband1')
        .set(forscherHeader1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/QTestProband1')
        .set(utHeader1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/QTestProband1')
        .set(sysadminHeader1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a pm tries that is not involved in the deletion', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/QTestProband1')
        .set(pmHeader4);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 404 when the pending deletion id does not exist', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/QTestProband15')
        .set(pmHeader1);
      expect(result, result.text).to.have.status(404);
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_by', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/QTestProband1')
        .set(pmHeader1);
      expect(result, result.text).to.have.status(200);
      expect(result.body.id).to.equal(1234560);
      expect(result.body.requested_by).to.equal('pm1@example.com');
      expect(result.body.requested_for).to.equal('pm2@example.com');
      expect(result.body.proband_id).to.equal('QTestProband1');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_for', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/QTestProband1')
        .set(pmHeader2);
      expect(result, result.text).to.have.status(200);
      expect(result.body.id).to.equal(1234560);
      expect(result.body.requested_by).to.equal('pm1@example.com');
      expect(result.body.requested_for).to.equal('pm2@example.com');
      expect(result.body.proband_id).to.equal('QTestProband1');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_by without email address', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/QTestProband3')
        .set(pmHeader3);
      expect(result, result.text).to.have.status(200);
      expect(result.body.id).to.equal(1234561);
      expect(result.body.requested_by).to.equal('pmNoEmail');
      expect(result.body.requested_for).to.equal('pm1@example.com');
      expect(result.body.proband_id).to.equal('QTestProband3');
    });
  });

  describe('POST /pendingdeletions', function () {
    beforeEach(async () => {
      fetchMock
        .get('express:/user/professional/:username/allProbands', {
          body: [
            'QTestProband1',
            'QTestProband3',
            'QTestProband4',
            'QTestProbandWithNoData',
          ],
        })
        .get('express:/user/users/:pseudonym/primaryStudy', {
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
      proband_id: 'QTestProband4',
    };

    const pdNoDataProband = {
      requested_for: 'pm2@example.com',
      proband_id: 'QTestProbandWithNoData',
    };

    const pdNoEmailPm = {
      requested_for: 'pmNoEmail',
      proband_id: 'QTestProband4',
    };

    it('should return HTTP 401 when the token is wrong', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(invalidHeader)
        .send(pdValid);
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(probandHeader1)
        .send(pdValid);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(forscherHeader1)
        .send(pdValid);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(utHeader1)
        .send(pdValid);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(sysadminHeader1)
        .send(pdValid);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 422 when a pm tries for himself', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader2)
        .send(pdValid);
      expect(result, result.text).to.have.status(422);
    });

    it('should return HTTP 422 when requested_for is no email address and not change proband status', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pdNoEmailPm);
      expect(result, result.text).to.have.status(422);
      const pendingDeletion = await db.oneOrNone(
        'SELECT * FROM pending_deletions WHERE proband_id=$1',
        pdNoEmailPm.proband_id
      );
      expect(pendingDeletion).to.be.null;
      expect(fetchMock.called('setAccountStatus')).to.be.false;
    });

    it('should return HTTP 200 if target proband has no personal data and create a pending deletion', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pdNoDataProband);
      expect(result, result.text).to.have.status(200);
      expect(result.body.requested_by).to.equal(pmSession1.username);
      expect(result.body.requested_for).to.equal(pdNoDataProband.requested_for);
      expect(result.body.proband_id).to.equal(pdNoDataProband.proband_id);
      const pendingDeletion = await db.oneOrNone(
        'SELECT * FROM pending_deletions WHERE proband_id=$1',
        pdNoDataProband.proband_id
      );
      expect(pendingDeletion).to.be.not.null;
      expect(fetchMock.called('setAccountStatus')).to.be.true;
      expect(fetchMock.lastCall('setAccountStatus')[1].body).to.contain(
        'deactivation_pending'
      );
    });

    it('should return HTTP 200 and create a pending deletion', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pdValid);
      expect(result, result.text).to.have.status(200);
      expect(result.body.requested_by).to.equal(pmSession1.username);
      expect(result.body.requested_for).to.equal(pdValid.requested_for);
      expect(result.body.proband_id).to.equal(pdValid.proband_id);
      const pendingDeletion = await db.oneOrNone(
        'SELECT * FROM pending_deletions WHERE proband_id=$1',
        pdValid.proband_id
      );
      expect(pendingDeletion).to.be.not.null;
      expect(fetchMock.called('setAccountStatus')).to.be.true;
      expect(fetchMock.lastCall('setAccountStatus')[1].body).to.contain(
        'deactivation_pending'
      );
    });

    it('should return HTTP 200 and create a pending deletion if no_email_pm requests', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader3)
        .send(pdValid);
      expect(result, result.text).to.have.status(200);
      expect(result.body.requested_by).to.equal(pmSession3.username);
      expect(result.body.requested_for).to.equal(pdValid.requested_for);
      expect(result.body.proband_id).to.equal(pdValid.proband_id);
      const pendingDeletion = await db.oneOrNone(
        'SELECT * FROM pending_deletions WHERE proband_id=$1',
        pdValid.proband_id
      );
      expect(pendingDeletion).to.be.not.null;
      expect(fetchMock.called('setAccountStatus')).to.be.true;
      expect(fetchMock.lastCall('setAccountStatus')[1].body).to.contain(
        'deactivation_pending'
      );
    });
  });

  describe('PUT /pendingdeletions/id', function () {
    it('should return HTTP 401 when the token is wrong', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/pendingdeletions/QTestProband1')
        .set(invalidHeader);
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/pendingdeletions/QTestProband1')
        .set(probandHeader1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/pendingdeletions/QTestProband1')
        .set(forscherHeader1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/pendingdeletions/QTestProband1')
        .set(utHeader1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/pendingdeletions/QTestProband1')
        .set(sysadminHeader1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 requested_by pm tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/pendingdeletions/QTestProband1')
        .set(pmHeader1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 wrong pm tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/pendingdeletions/QTestProband1')
        .set(pmHeader3);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 200 and delete all of probands data', async () => {
      fetchMock.post('express:/log/systemLogs', {});
      const result = await chai
        .request(apiAddress)
        .put('/pendingdeletions/QTestProband1')
        .set(pmHeader2);
      expect(result, result.text).to.have.status(200);
      expect(result.body.requested_by).to.equal('pm1@example.com');
      expect(result.body.requested_for).to.equal('pm2@example.com');
      expect(result.body.proband_id).to.equal('QTestProband1');
      const personalData = await db.oneOrNone(
        'SELECT * FROM personal_data WHERE pseudonym=$1',
        'QTestProband1'
      );
      expect(personalData).to.be.null;
      expect(fetchMock.called('setAccountStatus')).to.be.true;
      expect(fetchMock.lastCall('setAccountStatus')[1].body).to.contain(
        'deactivated'
      );
    });
  });

  describe('DELETE pendingdeletions/id', function () {
    beforeEach(async function () {
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/QTestProband1')
        .set(invalidHeader);
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/QTestProband1')
        .set(probandHeader1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/QTestProband1')
        .set(forscherHeader1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/QTestProband1')
        .set(utHeader1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/QTestProband1')
        .set(sysadminHeader1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a wrong pm tries', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/QTestProband1')
        .set(pmHeader3);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 204 and cancel deletion of proband data for requested_by pm', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/QTestProband1')
        .set(pmHeader1);
      expect(result, result.text).to.have.status(204);
      const pendingDeletion = await db.oneOrNone(
        'SELECT * FROM pending_deletions WHERE id=$1',
        1234560
      );
      expect(pendingDeletion).to.be.null;
      const personalData = await db.oneOrNone(
        'SELECT * FROM personal_data WHERE pseudonym=$1',
        'QTestProband1'
      );
      expect(personalData).to.be.be.an('object');
      expect(personalData.pseudonym).to.equal('QTestProband1');
      expect(fetchMock.called('setAccountStatus')).to.be.true;
      expect(fetchMock.lastCall('setAccountStatus')[1].body).to.contain(
        'active'
      );
    });

    it('should return HTTP 204 and cancel deletion of proband data for requested_for pm', async () => {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/QTestProband1')
        .set(pmHeader2);
      expect(result, result.text).to.have.status(204);
      const pendingDeletion = await db.oneOrNone(
        'SELECT * FROM pending_deletions WHERE id=$1',
        1234560
      );
      expect(pendingDeletion).to.be.null;
      const personalData = await db.oneOrNone(
        'SELECT * FROM personal_data WHERE pseudonym=$1',
        'QTestProband1'
      );
      expect(personalData).to.be.be.an('object');
      expect(personalData.pseudonym).to.equal('QTestProband1');
      expect(fetchMock.called('setAccountStatus')).to.be.true;
      expect(fetchMock.lastCall('setAccountStatus')[1].body).to.contain(
        'active'
      );
    });
  });
});
