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
const util = require('util');

const JWT = require('jsonwebtoken');
const secretOrPrivateKey = require('../secretOrPrivateKey');

const { setup, cleanup } = require('./authentication.spec.data/setup.helper');

const { Server } = require('../../src/server');
const { HttpClient } = require('@pia-system/lib-http-clients-internal');
const { MessageQueueClient } = require('@pia/lib-messagequeue');
const { GlobalConfig } = require('@pia/lib-service-core');
const {
  messageQueueService,
} = require('../../src/services/messageQueueService');
const { getRepository } = require('typeorm');
const { Account } = require('../../src/entities/account');

const delay = util.promisify(setTimeout);

const apiAddress = 'http://localhost:' + process.env.PORT + '/user';

const testSandbox = sinon.createSandbox();

const probandLogin = {
  logged_in_with: 'web',
  username: 'QTestProband1',
  password: 'Testpasswort',
  locale: 'de-DE',
};

const forscherLogin = {
  logged_in_with: 'web',
  username: 'QTestForscher1',
  password: 'Testpasswort',
  locale: 'de-DE',
};

const probandLoginNoUsername = {
  logged_in_with: 'web',
  password: 'Testpasswort',
};

const headerWithoutToken = { rejectUnauthorized: false };

// Access Tokens
const probandSession1 = { id: 1, role: 'Proband', username: 'QTestProband1' };
const probandToken1 = JWT.sign(probandSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandHeader1 = { authorization: probandToken1 };

const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
};
const forscherToken1 = JWT.sign(forscherSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherHeader1 = { authorization: forscherToken1 };

const invalidToken = JWT.sign(probandSession1, 'thisIsNotAValidPrivateKey', {
  expiresIn: '24h',
});
const invalidHeader = { authorization: invalidToken };

// Login Tokens
const probandLoginSession = { id: 2, username: 'QTestProband1' };
const probandLoginToken = JWT.sign(probandLoginSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '182 days',
});
const probandLoginHeader = { authorization: probandLoginToken };

const forscherLoginSession2 = { id: 2, username: 'forscher@test.de' };
const forscherLoginToken2 = JWT.sign(
  forscherLoginSession2,
  secretOrPrivateKey,
  {
    algorithm: 'RS512',
    expiresIn: '24h',
  }
);
const forscherLoginHeader2 = { authorization: forscherLoginToken2 };

const utSession = { id: 2, username: 'ut@test.de' };
const utLoginToken = JWT.sign(utSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const utLoginHeader = { authorization: utLoginToken };

const pmSession = { id: 2, username: 'pm@test.de' };
const pmToken = JWT.sign(pmSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmLoginHeader = { authorization: pmToken };

const sysadminSession = { id: 2, username: 'sysadmin@test.de' };
const sysadminLoginToken = JWT.sign(sysadminSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const sysadminLoginHeader = { authorization: sysadminLoginToken };

const invalidLoginToken = JWT.sign(
  probandLoginSession,
  'thisIsNotAValidPrivateKey',
  { expiresIn: '24h' }
);
const invalidLoginHeader = { authorization: invalidLoginToken };

describe('/authentication', function () {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  beforeEach(async () => {
    await setup();
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
  });

  afterEach(async () => {
    testSandbox.restore();
    fetchMock.restore();
    await cleanup();
  });

  describe('/login', function () {
    it('should not login with correct username if password entered thrice wrong', async function () {
      let response = await chai
        .request(apiAddress)
        .post('/login')
        .send({ ...probandLogin, password: 'Testpasswort1' })
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(403);
      response = await chai
        .request(apiAddress)
        .post('/login')
        .send({ ...probandLogin, password: 'Testpasswort2' })
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(403);
      response = await chai
        .request(apiAddress)
        .post('/login')
        .send({ ...probandLogin, password: 'Testpasswort3' })
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(403);
      response = await chai
        .request(apiAddress)
        .post('/login')
        .send(probandLogin)
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(403);
    });

    it('should login with correct username and password and return login token', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(probandLogin)
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(200);
      expect(response.body.username).to.equal('QTestProband1');
      expect(response.body.token).to.not.be.null;
      expect(response.body.token_login).to.not.be.null;
      const decoded = JWT.decode(response.body.token);
      expect(decoded).to.not.be.null;
      expect(decoded).to.own.include({
        id: 1,
        role: 'Proband',
        username: 'QTestProband1',
        locale: 'de-DE',
      });
    });

    it('should login with correct username and empty password', async function () {
      const loginEmptyPasswort = {
        logged_in_with: 'web',
        username: 'QTestProband2',
        password: '',
      };
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginEmptyPasswort)
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(200);
      expect(response.body.username).to.equal('QTestProband2');
      expect(response.body.token).to.not.equal(null);
      expect(response.body.token_login).to.not.equal(null);
      const decoded = JWT.decode(response.body.token);
      expect(decoded).to.not.be.null;
      expect(decoded).to.own.include({
        id: 1,
        role: 'Proband',
        username: 'QTestProband2',
        locale: 'en-US',
      });
    });

    it('should not login with empty username and password', async function () {
      const loginEmpty = {
        logged_in_with: '',
        username: ' ',
        password: ' ',
      };

      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginEmpty)
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(400);
    });

    it('should not login with wrong username and password', async function () {
      const loginWrong = {
        logged_in_with: 'web',
        username: 'Testproband99',
        password: 'Testpasswort99',
      };
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginWrong)
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(403);
    });

    it('should not login without username and without login token', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(probandLoginNoUsername)
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(401);
    });

    it('should not login with wrong device string', async function () {
      const loginWrongDevice = {
        logged_in_with: 'notValidDevice',
        username: 'QTestProband1',
        password: 'Testpasswort',
      };
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginWrongDevice)
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(400);
    });

    it('should not login without username and with incorrect login token', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(probandLoginNoUsername)
        .set(invalidHeader);
      expect(response, response.text).to.have.status(401);
    });

    it('should not login without username and with normal access token', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(probandLoginNoUsername)
        .set(probandHeader1);
      expect(response, response.text).to.have.status(401);
    });

    it('should not login if initial password ist not valid anymore', async function () {
      await getRepository(Account).insert({
        username: 'QTestProband3',
        password:
          'dafb7a7b4ae61f8c9dc76945f7e8f697256fdfa5a409ad059ec91c9b24cd6a7c404b5b1d8a88fea9faa32650c1e1baf4f750967ae0f8da92699c46dd7002f1f1eb9dda46f6555a304da1c0da5a7f0d81fcdaa39e1122862c2ae01cf5ce18b9aaf2ddb9021f2cba149eed0e73c130a8c464f9619bdfa6a3b778186ebc61707bf3',
        role: 'Proband',
        initialPasswordValidityDate: new Date(Date.now() - 1),
      });
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send({ ...probandLogin, username: 'QTestProband3' });
      expect(response, response.text).to.have.status(403);
    });

    it('should login without username and with login token', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/login')
        .send(probandLoginNoUsername)
        .set(probandLoginHeader);
      expect(response, response.text).to.have.status(200);
      expect(response.body.username).to.equal('QTestProband1');
      expect(response.body.token).to.not.equal(null);
    });

    it('should send "proband.logged_in" message on successful proband login', function (done) {
      // Arrange
      const testMessageQueueService = new MessageQueueClient(
        GlobalConfig.getMessageQueue('testservice')
      );
      const sendProbandLoggedInSpy = testSandbox.spy(
        messageQueueService,
        'sendProbandLoggedIn'
      );
      void testMessageQueueService
        .connect()
        .then(async () => {
          return testMessageQueueService.createConsumer(
            'proband.logged_in',
            async (message) => {
              // Assert
              expect(sendProbandLoggedInSpy.calledOnce).to.be.true;
              expect(message.pseudonym).to.equal('QTestProband1');
              await testMessageQueueService.disconnect();
              done();
            }
          );
        })
        .then(async () => {
          // Act
          return chai
            .request(apiAddress)
            .post('/login')
            .send(probandLogin)
            .set(headerWithoutToken);
        });
    });

    it('should not send "proband.logged_in" message on successful forscher login', function (done) {
      // Arrange
      const waitForMessageDuration = 1000;
      const testMessageQueueService = new MessageQueueClient(
        GlobalConfig.getMessageQueue('testservice')
      );
      const sendProbandLoggedInSpy = testSandbox.spy(
        messageQueueService,
        'sendProbandLoggedIn'
      );
      void testMessageQueueService
        .connect()
        .then(async () => {
          return testMessageQueueService.createConsumer(
            'proband.logged_in',
            async (message) => {
              // should never be called
              expect(message).to.be.undefined;
              await testMessageQueueService.disconnect();
              done();
            }
          );
        })
        .then(async () => {
          // Act
          return chai
            .request(apiAddress)
            .post('/login')
            .send(forscherLogin)
            .set(headerWithoutToken);
        })
        .then(async () => {
          // Assert
          await delay(waitForMessageDuration);
          expect(sendProbandLoggedInSpy.notCalled).to.be.true;
          await testMessageQueueService.disconnect();
          done();
        });
    });
  });

  describe('/changePassword', function () {
    it('changePassword with wrong old password', async function () {
      const changePasswordWrongOld = {
        oldPassword: 'TestpasswortOld',
        newPassword1: '1aA$bbbbbbbb',
        newPassword2: '1aA$bbbbbbbb',
      };

      const response_1 = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePasswordWrongOld)
        .set(probandHeader1);
      expect(response_1, response_1.text).to.have.status(403);
      const response_2 = await chai
        .request(apiAddress)
        .post('/login')
        .send(probandLogin)
        .set(headerWithoutToken);
      expect(response_2, response_2.text).to.have.status(200);
    });

    it('changePassword with different new passwords', async function () {
      const changePasswordWrongNew = {
        oldPassword: 'Testpasswort',
        newPassword1: '1aA$bbbbbbbb',
        newPassword2: '2aA$bbbbbbbb',
      };

      const response_1 = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePasswordWrongNew)
        .set(probandHeader1);
      expect(response_1, response_1.text).to.have.status(422);
      const response_2 = await chai
        .request(apiAddress)
        .post('/login')
        .send(probandLogin)
        .set(headerWithoutToken);
      expect(response_2, response_2.text).to.have.status(200);
    });

    it('changePassword with wrong header', async function () {
      const changePassword = {
        oldPassword: 'Testpasswort',
        newPassword1: '1aA$bbbb',
        newPassword2: '1aA$bbbb',
      };

      const response_1 = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(invalidHeader);
      expect(response_1, response_1.text).to.have.status(401);
      const response_2 = await chai
        .request(apiAddress)
        .post('/login')
        .send(probandLogin)
        .set(headerWithoutToken);
      expect(response_2, response_2.text).to.have.status(200);
    });

    it('should not change password if length<8', async function () {
      const changePassword = {
        oldPassword: 'Testpasswort',
        newPassword1: '1aA$bbb',
        newPassword2: '1aA$bbb',
      };

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result, result.text).to.have.status(400);
    });

    it('should not change password if no uppercase letter', async function () {
      const changePassword = {
        oldPassword: 'Testpasswort',
        newPassword1: '1aa$bbbb',
        newPassword2: '1aa$bbbb',
      };

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result, result.text).to.have.status(400);
    });

    it('should not change password if no lowercase letter', async function () {
      const changePassword = {
        oldPassword: 'Testpasswort',
        newPassword1: '1AA$BBBB',
        newPassword2: '1AA$BBBB',
      };

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result, result.text).to.have.status(400);
    });

    it('should not change password if no number', async function () {
      const changePassword = {
        oldPassword: 'Testpasswort',
        newPassword1: 'aaA$bbbb',
        newPassword2: 'aaA$bbbb',
      };

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result, result.text).to.have.status(400);
    });

    it('should not change password if no special sign', async function () {
      const changePassword = {
        oldPassword: 'Testpasswort',
        newPassword1: '1aAAbbbb',
        newPassword2: '1aAAbbbb',
      };

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result, result.text).to.have.status(400);
    });

    it('should not change password if new pw is empty string for non proband', async function () {
      const changePassword = {
        oldPassword: 'Testpasswort',
        newPassword1: '',
        newPassword2: '',
      };

      const response_1 = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(forscherHeader1);
      expect(response_1, response_1.text).to.have.status(403);
      const response_2 = await chai
        .request(apiAddress)
        .post('/login')
        .send(probandLogin)
        .set(headerWithoutToken);
      expect(response_2, response_2.text).to.have.status(200);
    });

    it('changePassword if all pw criteria are met', async function () {
      const changePassword = {
        oldPassword: 'Testpasswort',
        newPassword1: '1aA$bbbbbbbb',
        newPassword2: '1aA$bbbbbbbb',
      };
      const loginNew = {
        logged_in_with: 'web',
        username: 'QTestProband1',
        password: '1aA$bbbbbbbb',
      };

      const response_1 = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(response_1, response_1.text).to.have.status(200);
      expect(response_1.body.pw_change_needed).to.equal(false);

      const response_2 = await chai
        .request(apiAddress)
        .post('/login')
        .send(probandLogin)
        .set(headerWithoutToken);
      expect(response_2, response_2.text).to.have.status(403);

      const response_3 = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginNew)
        .set(headerWithoutToken);
      expect(response_3, response_3.text).to.have.status(200);
    });

    it('changePassword if it contains a "/"', async function () {
      const changePassword = {
        oldPassword: 'Testpasswort',
        newPassword1: '1aA/bbbbbbbb',
        newPassword2: '1aA/bbbbbbbb',
      };

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result, result.text).to.have.status(200);
    });

    it('changePassword if it contains a "."', async function () {
      const changePassword = {
        oldPassword: 'Testpasswort',
        newPassword1: '1aA.bbbbbbbb',
        newPassword2: '1aA.bbbbbbbb',
      };

      const result = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(result, result.text).to.have.status(200);
    });

    it('should change password if new password is empty string for proband', async function () {
      const changePassword = {
        oldPassword: 'Testpasswort',
        newPassword1: '',
        newPassword2: '',
      };

      const response_1 = await chai
        .request(apiAddress)
        .post('/changePassword')
        .send(changePassword)
        .set(probandHeader1);
      expect(response_1, response_1.text).to.have.status(200);
      expect(response_1.body.pw_change_needed).to.equal(false);

      const response_2 = await chai
        .request(apiAddress)
        .post('/login')
        .send(probandLogin)
        .set(headerWithoutToken);
      expect(response_2, response_2.text).to.have.status(403);

      const loginNew = {
        logged_in_with: 'web',
        username: 'QTestProband1',
        password: '',
      };

      const response_3 = await chai
        .request(apiAddress)
        .post('/login')
        .send(loginNew)
        .set(headerWithoutToken);
      expect(response_3, response_3.text).to.have.status(200);
    });
  });

  describe('/newPassword', function () {
    it('should not be able to request new password without username AND without login token', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/newPassword')
        .send({})
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(404);
    });

    it('should not be able to request new password without username and with incorrect login token', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(invalidLoginHeader);
      expect(response, response.text).to.have.status(401);
    });

    it('should not be able to request new password without username and with normal access token in header', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(probandHeader1);
      expect(response, response.text).to.have.status(401);
    });

    it('should report to send new password even if user does not exist', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({ user_id: 'nonExistingUser' })
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(200);
    });

    it('should not be able to request new password if user is professional without valid email as username', async function () {
      const response = await chai
        .request(apiAddress)
        .post('/newPassword')
        .send({ user_id: 'QTestForscher1' })
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(404);
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
      expect(response, response.text).to.have.status(200);
    });

    it('should be able to request new password as a proband with personal data with username', async function () {
      fetchMock.get(
        'path:/personal/personalData/proband/QTestProband1/email',
        'proband@example.com'
      );
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({ user_id: 'QTestProband1' })
        .set(headerWithoutToken);
      expect(response, response.text).to.have.status(200);
    });

    it('should be able to request new password as a proband with personal data with login token', async function () {
      fetchMock.get(
        'path:/personal/personalData/proband/QTestProband1/email',
        'proband@example.com'
      );
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(probandLoginHeader);
      expect(response, response.text).to.have.status(200);
    });

    it('should be able to request new password as a forscher with valid email address as username', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(forscherLoginHeader2);
      expect(response, response.text).to.have.status(200);
    });

    it('should be able to request new password as a PM with valid email address as username', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(pmLoginHeader);
      expect(response, response.text).to.have.status(200);
    });

    it('should be able to request new password as a UT with valid email address as username', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(utLoginHeader);
      expect(response, response.text).to.have.status(200);
    });

    it('should be able to request new password as a SysAdmin with valid email address as username', async function () {
      const response = await chai
        .request(apiAddress)
        .put('/newPassword')
        .send({})
        .set(sysadminLoginHeader);
      expect(response, response.text).to.have.status(200);
    });
  });
});
