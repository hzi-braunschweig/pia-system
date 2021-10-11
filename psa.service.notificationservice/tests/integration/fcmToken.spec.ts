/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
chai.use(chaiHttp);
import sinon from 'sinon';

import { ListeningDbClient } from '@pia/lib-service-core';
import { FcmHelper } from '../../src/services/fcmHelper';

import { setup, cleanup } from './fcmToken.spec.data/setup.helper';

import secretOrPrivateKey from '../secretOrPrivateKey';
import { Server } from '../../src/server';

import JWT from 'jsonwebtoken';
import StatusCodes from 'http-status-codes';

const apiAddress = `http://localhost:${
  process.env['PORT'] ?? '80'
}/notification`;

const suiteSandbox = sinon.createSandbox();

const probandSession1 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband1',
  groups: ['study'],
};
const probandSession2 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband2',
  groups: ['study'],
};
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
  groups: ['study'],
};
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam',
  groups: ['study'],
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

interface FcmToken {
  fcm_token: string;
}

describe('/fcmToken', function () {
  before(async function () {
    suiteSandbox.stub(ListeningDbClient.prototype);
    suiteSandbox.stub(FcmHelper, 'sendDefaultNotification');
    suiteSandbox.stub(FcmHelper, 'initFBAdmin');
    await setup();
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    await cleanup();
    suiteSandbox.restore();
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
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 401 if the user is not in db', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader2)
        .send(payload);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 400 if the payloads fields are misspelled', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader1)
        .send({ payloadInvalid1 });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 400 if the token is an empty string', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader1)
        .send({ payloadInvalid2 });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 400 if the token is null', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader1)
        .send({ payloadInvalid3 });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 200 and create the Probands token', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(probandHeader1)
        .send(payload);
      expect(result).to.have.status(StatusCodes.OK);
      expect((result.body as FcmToken).fcm_token).to.equal(
        'thisisjustarandomstring'
      );
    });

    it('should return HTTP 200 and create the Forschers token', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(forscherHeader1)
        .send(payload);
      expect(result).to.have.status(StatusCodes.OK);
      expect((result.body as FcmToken).fcm_token).to.equal(
        'thisisjustarandomstring'
      );
    });

    it('should return HTTP 200 and create the Untersuchungsteams token', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(utHeader)
        .send(payload);
      expect(result).to.have.status(StatusCodes.OK);
      expect((result.body as FcmToken).fcm_token).to.equal(
        'thisisjustarandomstring'
      );
    });

    it('should return HTTP 400 for the SysAdmins because he has no study access', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/fcmToken')
        .set(sysadminHeader)
        .send(payload);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });
  });
});
