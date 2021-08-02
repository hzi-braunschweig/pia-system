/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const {
  setup,
  cleanup,
} = require('./questionnaireInstances.spec.data/setup.helper');
const secretOrPrivateKey = require('../secretOrPrivateKey');
const JWT = require('jsonwebtoken');
const server = require('../../src/server');

const apiAddress = 'http://localhost:' + process.env.PORT + '/questionnaire';

const probandSession1 = { id: 1, role: 'Proband', username: 'QTestProband1' };
const probandSession2 = { id: 1, role: 'Proband', username: 'QTestProband2' };
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
};
const forscherSession2 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher2',
};
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam',
};
const utSession2 = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam2',
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
    await server.init();
  });

  after(async function () {
    await server.stop();
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
      expect(result).to.have.status(200);
      expect(result.body).to.have.property('file');
      expect(result.body).to.have.property('file_name');
      expect(result.body.file).to.equal(clockImageAsBase64);
    });
    it('should has name "clock.svg"', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(probandHeader1);
      expect(result.body.file_name).to.equal('clock.svg');
    });

    it('should return HTTP 200 and image id for Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(forscherHeader1);
      expect(result).to.have.status(200);
      expect(result.body).to.have.property('file');
      expect(result.body).to.have.property('file_name');
      expect(result.body.file).to.equal(clockImageAsBase64);
    });

    it('should return HTTP 403 if user does not own the image', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(probandHeader2);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if forscher has no study access', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(forscherHeader2);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 404 if UT tries for instances that is for proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(utHeader);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 403 if UT tries for instances that is for UT but wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/7777771')
        .set(utHeader2);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 and image id for UT if the instance is for UT and the study matches', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/7777771')
        .set(utHeader);
      expect(result).to.have.status(200);
      expect(result.body).to.have.property('file');
      expect(result.body.file).to.equal(clockImageAsBase64);
    });

    it('should return HTTP 401 if user has invalid header', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if image does not belong to user ', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/99996')
        .set(probandHeader2);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 404 if image does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/files/999')
        .set(probandHeader2);
      expect(result).to.have.status(404);
    });
  });
});
