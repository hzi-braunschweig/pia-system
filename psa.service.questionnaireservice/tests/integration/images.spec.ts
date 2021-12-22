/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import JWT from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

import secretOrPrivateKey from '../secretOrPrivateKey';
import { File } from '../../src/models/file';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { cleanup, setup } from './images.spec.data/setup.helper';

chai.use(chaiHttp);

const apiAddress =
  'http://localhost:' + config.public.port.toString() + '/questionnaire';

const probandSession1 = {
  id: 1,
  role: 'Proband',
  username: 'QTestStudieProband1',
  groups: ['ApiTestStudie'],
};
const probandSession2 = {
  id: 1,
  role: 'Proband',
  username: 'QTestStudi2Proband2',
  groups: ['ApiTestStudi2'],
};
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
  groups: ['ApiTestStudie', 'ApiTestMultiProfs'],
};
const forscherSession2 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher2',
  groups: ['ApiTestStudi2', 'ApiTestStudi4', 'ApiTestMultiProfs'],
};
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam',
  groups: ['ApiTestMultiProfs', 'ApiTestStudi2', 'ApiTestStudie'],
};
const utSession2 = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam2',
  groups: ['ApiTestStudi2', 'ApiTestMultiProfs'],
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
const forscherToken2 = JWT.sign(forscherSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const utToken = JWT.sign(utSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const utToken2 = JWT.sign(utSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = {
  authorization: probandToken1,
  rejectUnauthorized: false,
};
const probandHeader2 = { authorization: probandToken2 };
const forscherHeader1 = { authorization: forscherToken1 };
const forscherHeader2 = { authorization: forscherToken2 };
const utHeader = { authorization: utToken };
const utHeader2 = { authorization: utToken2 };

describe('images/', function () {
  before(async function () {
    await setup();
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    await cleanup();
  });

  const clockImageAsBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC';

  describe('GET images/image', function () {
    it('should return HTTP 200 and image id for Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.property('file');
      expect(result.body).to.have.property('file_name');
      expect((result.body as File).file).to.equal(clockImageAsBase64);
    });

    it('should have name "clock.svg"', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(probandHeader1);
      expect((result.body as File).file_name).to.equal('clock.svg');
    });

    it('should return HTTP 200 and image id for Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.property('file');
      expect(result.body).to.have.property('file_name');
      expect((result.body as File).file).to.equal(clockImageAsBase64);
    });

    it('should return HTTP 403 if forscher has no study access', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(forscherHeader2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if UT tries for instances that is for proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 403 if UT tries for instances that is for UT but wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/7777771')
        .set(utHeader2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and image id for UT if the instance is for UT and the study matches', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/7777771')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.property('file');
      expect((result.body as File).file).to.equal(clockImageAsBase64);
    });

    it('should return HTTP 401 if user has invalid header', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if image does not belong to user ', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if image does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/999')
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });
  });
});
