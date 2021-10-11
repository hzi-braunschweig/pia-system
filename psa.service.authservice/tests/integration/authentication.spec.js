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
const fetchMock = require('fetch-mock').sandbox();
const fetch = require('node-fetch');

const JWT = require('jsonwebtoken');
const secretOrPrivateKey = require('../secretOrPrivateKey');

const { db } = require('../../src/db');
const { setup, cleanup } = require('./authentication.spec.data/setup.helper');

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT + '/user';

const testSandbox = sinon.createSandbox();

const login = {
  logged_in_with: 'web',
  username: 'UTestProband1',
  password: 'Testpasswort',
  locale: 'de-DE',
};

const loginNew = {
  logged_in_with: 'web',
  username: 'UTestProband1',
  password: '1aA$bbbbbbbb',
};

const loginNew2 = {
  logged_in_with: 'web',
  username: 'UTestProband1',
  password: '',
};

const loginEmpty = {
  logged_in_with: '',
  username: ' ',
  password: ' ',
};

const loginNoUsername = {
  logged_in_with: 'web',
  password: 'Testpasswort',
};

const loginEmptyPasswort = {
  logged_in_with: 'web',
  username: 'UTestProband2',
  password: '',
};

const loginWrongDevice = {
  logged_in_with: 'notValidDevice',
  username: 'UTestProband1',
  password: 'Testpasswort',
};

const loginWrong = {
  logged_in_with: 'web',
  username: 'Testproband99',
  password: 'Testpasswort99',
};

const probandSession1 = { id: 1, role: 'Proband', username: 'UTestProband1' };
const probandToken1 = JWT.sign(probandSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandHeader1 = { authorization: probandToken1 };

const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'APITestforscher',
};
const forscherToken1 = JWT.sign(forscherSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherHeader1 = { authorization: forscherToken1 };

const probandLoginSession = { id: 2, username: 'UTestProband1' };
const probandLoginToken = JWT.sign(probandLoginSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '182 days',
});
const probandLoginHeader = { authorization: probandLoginToken };

const headerWithoutToken = { rejectUnauthorized: false };

const invalidToken = JWT.sign(probandSession1, 'thisIsNotAValidPrivateKey', {
  expiresIn: '24h',
});
const invalidHeader = { authorization: invalidToken };

const changePassword = {
  username: 'UTestProband1',
  oldPassword: 'Testpasswort',
  newPassword1: '1aA$bbbb',
  newPassword2: '1aA$bbbb',
};
const changePasswordWrongOld = {
  username: 'UTestProband1',
  oldPassword: 'TestpasswortOld',
  newPassword1: '1aA$bbbbbbbb',
  newPassword2: '1aA$bbbbbbbb',
};

const changePasswordWrongNew = {
  username: 'UTestProband1',
  oldPassword: 'Testpasswort',
  newPassword1: '1aA$bbbbbbbb',
  newPassword2: '2aA$bbbbbbbb',
};

describe('/authentication', function () {
  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
  });

  beforeEach(async () => {
    await setup();
    testSandbox.stub(fetch, 'default').callsFake(fetchMock);
    fetchMock.catch(503).post('express:/log/logs/:user', 200);
  });

  afterEach(async () => {
    testSandbox.restore();
    fetchMock.restore();
    await cleanup();
  });

  describe('/login', function () {
    it('login with correct username and password and return login token', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(login)
        .set(headerWithoutToken);
      expect(response, JSON.stringify(response.body)).to.have.status(200);
      expect(response.body.username).to.equal('UTestProband1');
      expect(response.body.token).to.not.be.null;
      expect(response.body.token_login).to.not.be.null;
      expect(response.body.compliance_labresults).to.equal(true);
      expect(response.body.logged_in_with).to.equal('web');
      const decoded = JWT.decode(response.body.token);
      expect(decoded).to.not.be.null;
      expect(decoded).to.own.include({
        id: 1,
        role: 'Proband',
        username: 'UTestProband1',
        locale: 'de-DE',
      });
    });

    it(' should login with correct username and empty password', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginEmptyPasswort)
        .set(headerWithoutToken);
      expect(response).to.have.status(200);
      expect(response.body.username).to.equal('UTestProband2');
      expect(response.body.token).to.not.equal(null);
      expect(response.body.token_login).to.not.equal(null);
      expect(response.body.compliance_labresults).to.equal(true);
      expect(response.body.logged_in_with).to.equal('web');
      const decoded = JWT.decode(response.body.token);
      expect(decoded).to.not.be.null;
      expect(decoded).to.own.include({
        id: 1,
        role: 'Proband',
        username: 'UTestProband2',
        locale: 'en-US',
      });
    });

    it('login with empty username and password', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginEmpty)
        .set(headerWithoutToken);
      expect(response).to.have.status(400);
    });

    it('login with wrong username and password', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginWrong)
        .set(headerWithoutToken);
      expect(response).to.have.status(403);
    });

    it('should not login without username and without login token', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginNoUsername)
        .set(headerWithoutToken);
      expect(response).to.have.status(401);
    });

    it('should not login with wrong device string', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginWrongDevice)
        .set(headerWithoutToken);
      expect(response).to.have.status(400);
    });

    it('should not login without username and with incorrect login token', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginNoUsername)
        .set(invalidHeader);
      expect(response).to.have.status(401);
    });

    it('should not login without username and with normal access token', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginNoUsername)
        .set(probandHeader1);
      expect(response).to.have.status(401);
    });

    it('should login without username and with login token', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginNoUsername)
        .set(probandLoginHeader);
      expect(response).to.have.status(200);
      expect(response.body.username).to.equal('UTestProband1');
      expect(response.body.compliance_labresults).to.equal(true);
      expect(response.body.token).to.not.equal(null);
    });
  });

  describe('/changePassword', function () {
    it('changePassword with wrong old password', async function () {
      const response_1 = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePasswordWrongOld)
        .set(probandHeader1);
      expect(response_1).to.have.status(403);
      const response_2 = await chai
        .request(apiAddress)
        .post('/login')
        .send(login)
        .set(headerWithoutToken);
      expect(response_2).to.have.status(200);
    });

    it('changePassword with different new passwords', async function () {
      const response_1 = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePasswordWrongNew)
        .set(probandHeader1);
      expect(response_1).to.have.status(422);
      const response_2 = await chai
        .request(apiAddress)
        .post('/login')
        .send(login)
        .set(headerWithoutToken);
      expect(response_2).to.have.status(200);
    });

    it('changePassword with wrong header', async function () {
      const response_1 = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(invalidHeader);
      expect(response_1).to.have.status(401);
      const response_2 = await chai
        .request(apiAddress)
        .post('/login')
        .send(login)
        .set(headerWithoutToken);
      expect(response_2).to.have.status(200);
    });

    it('should not change password if length<8', async function () {
      changePassword.newPassword1 = '1aA$bbb';
      changePassword.newPassword2 = '1aA$bbb';

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result).to.have.status(400);
    });

    it('should not change password if no uppercase letter', async function () {
      changePassword.newPassword1 = '1aa$bbbb';
      changePassword.newPassword2 = '1aa$bbbb';

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result).to.have.status(400);
    });

    it('should not change password if no lowercase letter', async function () {
      changePassword.newPassword1 = '1AA$BBBB';
      changePassword.newPassword2 = '1AA$BBBB';

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result).to.have.status(400);
    });

    it('should not change password if no number', async function () {
      changePassword.newPassword1 = 'aaA$bbbb';
      changePassword.newPassword2 = 'aaA$bbbb';

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result).to.have.status(400);
    });

    it('should not change password if no special sign', async function () {
      changePassword.newPassword1 = '1aAAbbbb';
      changePassword.newPassword2 = '1aAAbbbb';

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result).to.have.status(400);
    });

    it('should not change password if new pw is empty string for non proband', async function () {
      changePassword.oldPassword = 'Testpasswort';
      changePassword.newPassword1 = '';
      changePassword.newPassword2 = '';

      const response_1 = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(forscherHeader1);
      expect(response_1).to.have.status(403);
      const response_2 = await chai
        .request(apiAddress)
        .post('/login')
        .send(login)
        .set(headerWithoutToken);
      expect(response_2).to.have.status(200);
    });

    it('changePassword if all pw criteria are met', async function () {
      changePassword.newPassword1 = '1aA$bbbbbbbb';
      changePassword.newPassword2 = changePassword.newPassword1;

      const response_1 = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(response_1).to.have.status(200);
      expect(response_1.body.username).to.equal('UTestProband1');
      expect(response_1.body.pw_change_needed).to.equal(false);
      expect(response_1.body.compliance_labresults).to.equal(true);

      const response_2 = await chai
        .request(apiAddress)
        .post('/login')
        .send(login)
        .set(headerWithoutToken);
      expect(response_2).to.have.status(403);

      const response_3 = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginNew)
        .set(headerWithoutToken);
      expect(response_3).to.have.status(200);
    });

    it('changePassword if it contains a "/"', async function () {
      changePassword.oldPassword = 'Testpasswort';
      changePassword.newPassword1 = '1aA/bbbbbbbb';
      changePassword.newPassword2 = '1aA/bbbbbbbb';

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result).to.have.status(200);
    });

    it('changePassword if it contains a "."', async function () {
      changePassword.oldPassword = 'Testpasswort';
      changePassword.newPassword1 = '1aA.bbbbbbbb';
      changePassword.newPassword2 = '1aA.bbbbbbbb';

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result).to.have.status(200);
    });

    it('should change password if new password is empty string for proband', async function () {
      changePassword.oldPassword = 'Testpasswort';
      changePassword.newPassword1 = '';
      changePassword.newPassword2 = '';

      const response_1 = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(response_1).to.have.status(200);
      expect(response_1.body.username).to.equal('UTestProband1');
      expect(response_1.body.pw_change_needed).to.equal(false);
      expect(response_1.body.compliance_labresults).to.equal(true);

      const response_2 = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginNew)
        .set(headerWithoutToken);
      expect(response_2).to.have.status(403);

      const response_3 = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginNew2)
        .set(headerWithoutToken);
      expect(response_3).to.have.status(200);
    });
  });

  describe('/newPassword', function () {
    const probandSession1Access = {
      id: 1,
      role: 'Proband',
      username: 'UTestProband1',
    };
    const probandToken1Access = JWT.sign(
      probandSession1Access,
      secretOrPrivateKey,
      {
        algorithm: 'RS512',
        expiresIn: '24h',
      }
    );
    const probandHeader1Access = { authorization: probandToken1Access };

    const probandSession1 = { id: 2, username: 'QTestProband1' };
    const forscherSession2 = { id: 2, username: 'forscher@test.de' };
    const utSession = { id: 2, username: 'ut@test.de' };
    const sysadminSession = { id: 2, username: 'sysadmin@test.de' };
    const pmSession = { id: 2, username: 'pm@test.de' };

    const invalidToken = JWT.sign(
      probandSession1,
      'thisIsNotAValidPrivateKey',
      { expiresIn: '24h' }
    );
    const probandToken1 = JWT.sign(probandSession1, secretOrPrivateKey, {
      algorithm: 'RS512',
      expiresIn: '24h',
    });
    const forscherToken2 = JWT.sign(forscherSession2, secretOrPrivateKey, {
      algorithm: 'RS512',
      expiresIn: '24h',
    });
    const utToken = JWT.sign(utSession, secretOrPrivateKey, {
      algorithm: 'RS512',
      expiresIn: '24h',
    });
    const sysadminToken = JWT.sign(sysadminSession, secretOrPrivateKey, {
      algorithm: 'RS512',
      expiresIn: '24h',
    });
    const pmToken = JWT.sign(pmSession, secretOrPrivateKey, {
      algorithm: 'RS512',
      expiresIn: '24h',
    });

    const invalidHeader = { authorization: invalidToken };
    const probandHeader1 = { authorization: probandToken1 };
    const forscherHeader2 = { authorization: forscherToken2 };
    const utHeader = { authorization: utToken };
    const sysadminHeader = { authorization: sysadminToken };
    const pmHeader = { authorization: pmToken };

    before(async function () {
      await db.none('DELETE FROM users WHERE username IN($1:csv)', [
        [
          'QTestProband1',
          'QTestProband2',
          'QTestForscher1',
          'ut@test.de',
          'sysadmin@test.de',
          'forscher@test.de',
          'pm@test.de',
        ],
      ]);

      await db.none('INSERT INTO users VALUES ($1, $2, $3, $4)', [
        'QTestProband1',
        '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
        'Proband',
        null,
      ]);
      await db.none('INSERT INTO users VALUES ($1, $2, $3, $4)', [
        'QTestProband2',
        '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
        'Proband',
        null,
      ]);
      await db.none('INSERT INTO users VALUES ($1, $2, $3, $4)', [
        'QTestForscher1',
        '9dd01c80bb400e844cba017d2c1a70ac4a13f890fd39d19cbe0b05a9b6cc5805c9b1e8003d41123144db039df6cb9ad1383d3a387a55776105c89c94c92c5e45',
        'Forscher',
        null,
      ]);
      await db.none('INSERT INTO users VALUES ($1, $2, $3, $4)', [
        'ut@test.de',
        'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
        'Untersuchungsteam',
        null,
      ]);
      await db.none('INSERT INTO users VALUES ($1, $2, $3, $4)', [
        'pm@test.de',
        'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
        'ProbandenManager',
        null,
      ]);
      await db.none('INSERT INTO users VALUES ($1, $2, $3, $4)', [
        'sysadmin@test.de',
        'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
        'SysAdmin',
        null,
      ]);
      await db.none('INSERT INTO users VALUES ($1, $2, $3, $4)', [
        'forscher@test.de',
        'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
        'Forscher',
        null,
      ]);
    });

    after(async function () {
      await db.none('DELETE FROM users WHERE username IN($1:csv)', [
        [
          'QTestProband1',
          'QTestProband2',
          'QTestForscher1',
          'ut@test.de',
          'sysadmin@test.de',
          'forscher@test.de',
          'pm@test.de',
        ],
      ]);
    });

    it('should not be able to request new password without username AND without login token', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/newPassword')
        .send({})
        .set(headerWithoutToken);
      expect(response).to.have.status(404);
    });

    it('should not be able to request new password without username and with incorrect login token', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(invalidHeader);
      expect(response).to.have.status(401);
    });

    it('should not be able to request new password without username and with normal access token in header', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(probandHeader1Access);
      expect(response).to.have.status(401);
    });

    it('should report to send new password even if user does not exist', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({ user_id: 'nonExistingUser' })
        .set(headerWithoutToken);
      expect(response).to.have.status(200);
    });

    it('should not be able to request new password if user is professional without valid email as username', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/newPassword')
        .send({ user_id: 'QTestForscher1' })
        .set(headerWithoutToken);
      expect(response).to.have.status(404);
    });

    it('should report to send email even if user is proband that has no personal data', async function () {
      fetchMock.get(
        'path:/personal/personalData/proband/QTestProband2/email',
        404
      );
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({ user_id: 'QTestProband2' })
        .set(headerWithoutToken);
      expect(response).to.have.status(200);
    });

    it('should be able to request new password as a proband with personal data with username', async function () {
      fetchMock.get(
        'path:/personal/personalData/proband/QTestProband2/email',
        'proband@example.com'
      );
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({ user_id: 'QTestProband1' })
        .set(headerWithoutToken);
      expect(response).to.have.status(200);
    });

    it('should be able to request new password as a proband with personal data with login token', async function () {
      fetchMock.get(
        'path:/personal/personalData/proband/QTestProband2/email',
        'proband@example.com'
      );
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(probandHeader1);
      expect(response).to.have.status(200);
    });

    it('should be able to request new password as a forscher with valid email address as username', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(forscherHeader2);
      expect(response).to.have.status(200);
    });

    it('should be able to request new password as a PM with valid email address as username', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(pmHeader);
      expect(response).to.have.status(200);
    });

    it('should be able to request new password as a UT with valid email address as username', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(utHeader);
      expect(response).to.have.status(200);
    });

    it('should be able to request new password as a SysAdmin with valid email address as username', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(sysadminHeader);
      expect(response).to.have.status(200);
    });
  });
});
