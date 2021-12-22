/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import secretOrPrivateKey from '../secretOrPrivateKey';
import JWT from 'jsonwebtoken';
import { Server } from '../../src/server';
import { cleanup, setup } from './userSettings.spec.data/setup.helper';
import { config } from '../../src/config';
import StatusCodes from 'http-status-codes';
import { JsonPresenterResponse } from './instance.helper.spec';
import { ProbandSettings } from '../../src/models/probandSettings';

chai.use(chaiHttp);
const apiAddress = `http://localhost:${config.public.port}`;

const probandSession1 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband1',
  groups: ['QTestStudy1'],
};
const probandSession2 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband2',
  groups: ['QTestStudy2'],
};
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
  groups: ['QTestStudy1'],
};
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam',
  groups: ['QTestStudy1'],
};
const sysadminSession = {
  id: 1,
  role: 'SysAdmin',
  username: 'QTestSystemAdmin',
  groups: [],
};

const invalidToken = JWT.sign(probandSession1, 'thisIsNotAValidPrivateKey', {
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

describe('/user/userSettings', function () {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('PUT userSettings/username', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    const userSettings = {
      logging_active: false,
    };

    const userSettingsInvalid = {};

    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/user/userSettings/QTestProband1')
        .set(invalidHeader)
        .send(userSettings);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 404 if the user tries to change settings for someone else', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/user/userSettings/QTestProband1')
        .set(probandHeader2)
        .send(userSettings);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/user/userSettings/QTestProband1')
        .set(forscherHeader1)
        .send(userSettings);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/user/userSettings/QTestProband1')
        .set(utHeader)
        .send(userSettings);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a Sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/user/userSettings/QTestProband1')
        .set(sysadminHeader)
        .send(userSettings);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 400 if logging_active bool is missing', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/user/userSettings/QTestProband1')
        .set(probandHeader1)
        .send(userSettingsInvalid);
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 200 and update the users Settings', async function () {
      const result: JsonPresenterResponse<ProbandSettings> = await chai
        .request(apiAddress)
        .put('/user/userSettings/QTestProband1')
        .set(probandHeader1)
        .send(userSettings);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.logging_active).to.equal(false);
      expect(result.body.links.self.href).to.equal(
        '/userSettings/QTestProband1'
      );
    });
  });

  describe('GET userSettings/username', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/user/userSettings/QTestProband1')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 404 if the user tries to get settings for someone else', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/user/userSettings/QTestProband1')
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/user/userSettings/QTestProband1')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/user/userSettings/QTestProband1')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a Sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/user/userSettings/QTestProband1')
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 and return the users Settings', async function () {
      const result: JsonPresenterResponse<ProbandSettings> = await chai
        .request(apiAddress)
        .get('/user/userSettings/QTestProband1')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.logging_active).to.equal(true);
      expect(result.body.links.self.href).to.equal(
        '/userSettings/QTestProband1'
      );
    });
  });
});
