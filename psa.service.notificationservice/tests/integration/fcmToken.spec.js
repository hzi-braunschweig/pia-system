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

const { ListeningDbClient } = require('@pia/lib-service-core');
const fcmHelper = require('../../src/services/fcmHelper.js');

const { setup, cleanup } = require('./fcmToken.spec.data/setup.helper');

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
const sysadminToken = JWT.sign(sysadminSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const probandHeader2 = { authorization: probandToken2 };
const forscherHeader1 = { authorization: forscherToken1 };
const utHeader = { authorization: utToken };
const sysadminHeader = { authorization: sysadminToken };

describe('/fcmToken', function () {
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

  describe('POST fcmToken', function () {
    const payload = {
      fcm_token: 'thisisjustarandomstring',
    };

    const payloadInvalid1 = {
      fcmm_token: 'thisisjustarandomstring',
    };

    const payloadInvalid2 = {
      fcm_token: '',
    };

    const payloadInvalid3 = {
      fcm_token: null,
    };

    it('should return HTTP 401 if the token is invalid', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(invalidHeader)
        .send(payload);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 401 if the user is not in db', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader2)
        .send(payload);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 400 if the payloads fields are misspelled', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader1)
        .send({ payloadInvalid1 });
      expect(result).to.have.status(400);
    });

    it('should return HTTP 400 if the token is an empty string', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader1)
        .send({ payloadInvalid2 });
      expect(result).to.have.status(400);
    });

    it('should return HTTP 400 if the token is null', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader1)
        .send({ payloadInvalid3 });
      expect(result).to.have.status(400);
    });

    it('should return HTTP 200 and create the Probands token', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader1)
        .send(payload);
      expect(result).to.have.status(200);
      expect(result.body.fcm_token).to.equal('thisisjustarandomstring');
    });

    it('should return HTTP 200 and create the Forschers token', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(forscherHeader1)
        .send(payload);
      expect(result).to.have.status(200);
      expect(result.body.fcm_token).to.equal('thisisjustarandomstring');
    });

    it('should return HTTP 200 and create the Untersuchungsteams token', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(utHeader)
        .send(payload);
      expect(result).to.have.status(200);
      expect(result.body.fcm_token).to.equal('thisisjustarandomstring');
    });

    it('should return HTTP 200 and create the SysAdmins token', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(sysadminHeader)
        .send(payload);
      expect(result).to.have.status(200);
      expect(result.body.fcm_token).to.equal('thisisjustarandomstring');
    });
  });
});
