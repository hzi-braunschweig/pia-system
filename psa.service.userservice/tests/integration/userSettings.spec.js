/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const secretOrPrivateKey = require('../secretOrPrivateKey');

const { db } = require('../../src/db');

const JWT = require('jsonwebtoken');

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT + '/user';

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

describe('/userSettings', function () {
  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
  });

  describe('PUT userSettings/username', function () {
    before(async function () {
      await db.none('DELETE FROM study_users WHERE user_id=$1', [
        'QTestProband1',
      ]);
      await db.none(
        'DELETE FROM users WHERE username=$1 OR username=$2 OR username=$3 OR username=$4 OR username=$5',
        [
          'QTestProband1',
          'QTestProband2',
          'QTestForscher1',
          'QTestUntersuchungsteam',
          'QTestSystemAdmin',
        ]
      );
      await db.none('DELETE FROM studies WHERE name IN($1:csv)', [
        'ApiTestStudie',
        'ApiTestMultiProband',
      ]);

      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband2',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestForscher1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Forscher',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestUntersuchungsteam',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Untersuchungsteam',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestSystemAdmin',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'SysAdmin',
        ],
      ]);

      await db.none('INSERT INTO studies VALUES ($1, $2)', [
        'ApiTestStudie',
        'ApiTestStudie Beschreibung',
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestMultiProband Beschreibung]'],
      ]);

      await db.none('INSERT INTO study_users VALUES($1, $2, $3)', [
        'ApiTestStudie',
        'QTestProband1',
        'read',
      ]);
      await db.none('INSERT INTO study_users VALUES($1, $2, $3)', [
        'ApiTestMultiProband',
        'QTestProband1',
        'read',
      ]);
    });

    after(async function () {
      await db.none('DELETE FROM study_users WHERE user_id=$1', [
        'QTestProband1',
      ]);
      await db.none(
        'DELETE FROM users WHERE username=$1 OR username=$2 OR username=$3 OR username=$4 OR username=$5',
        [
          'QTestProband1',
          'QTestProband2',
          'QTestForscher1',
          'QTestUntersuchungsteam',
          'QTestSystemAdmin',
        ]
      );
      await db.none('DELETE FROM studies WHERE name IN($1:csv)', [
        'ApiTestStudie',
        'ApiTestMultiProband',
      ]);
    });

    const userSettings = {
      logging_active: false,
    };

    const userSettingsInvalid = {};

    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/userSettings/QTestProband1')
        .set(invalidHeader)
        .send(userSettings);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 404 if the user tries to change settings for someone else', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/userSettings/QTestProband1')
        .set(probandHeader2)
        .send(userSettings);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/userSettings/QTestProband1')
        .set(forscherHeader1)
        .send(userSettings);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/userSettings/QTestProband1')
        .set(utHeader)
        .send(userSettings);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/userSettings/QTestProband1')
        .set(sysadminHeader)
        .send(userSettings);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 400 if logging_active bool is missing', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/userSettings/QTestProband1')
        .set(probandHeader1)
        .send(userSettingsInvalid);
      expect(result).to.have.status(400);
    });

    it('should return HTTP 200 and update the users Settings', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/userSettings/QTestProband1')
        .set(probandHeader1)
        .send(userSettings);
      expect(result).to.have.status(200);
      expect(result.body.logging_active).to.equal(false);
      expect(result.body.links.self.href).to.equal(
        '/userSettings/QTestProband1'
      );
    });
  });

  describe('GET userSettings/username', function () {
    before(async function () {
      await db.none('DELETE FROM study_users WHERE user_id=$1', [
        'QTestProband1',
      ]);
      await db.none(
        'DELETE FROM users WHERE username=$1 OR username=$2 OR username=$3 OR username=$4 OR username=$5',
        [
          'QTestProband1',
          'QTestProband2',
          'QTestForscher1',
          'QTestUntersuchungsteam',
          'QTestSystemAdmin',
        ]
      );
      await db.none('DELETE FROM studies WHERE name=$1', ['ApiTestStudie']);

      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          null,
          '17:30',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband2',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          null,
          '07:15',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestForscher1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Forscher',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestUntersuchungsteam',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Untersuchungsteam',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestSystemAdmin',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'SysAdmin',
        ],
      ]);

      await db.none('INSERT INTO studies VALUES ($1, $2)', [
        'ApiTestStudie',
        'ApiTestStudie Beschreibung',
      ]);
      await db.none('INSERT INTO study_users VALUES($1, $2, $3)', [
        'ApiTestStudie',
        'QTestProband1',
        'read',
      ]);
    });

    after(async function () {
      await db.none('DELETE FROM study_users WHERE user_id=$1', [
        'QTestProband1',
      ]);
      await db.none(
        'DELETE FROM users WHERE username=$1 OR username=$2 OR username=$3 OR username=$4 OR username=$5',
        [
          'QTestProband1',
          'QTestProband2',
          'QTestForscher1',
          'QTestUntersuchungsteam',
          'QTestSystemAdmin',
        ]
      );
      await db.none('DELETE FROM studies WHERE name=$1', ['ApiTestStudie']);
    });

    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/userSettings/QTestProband1')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 404 if the user tries to get settings for someone else', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/userSettings/QTestProband1')
        .set(probandHeader2);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/userSettings/QTestProband1')
        .set(forscherHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/userSettings/QTestProband1')
        .set(utHeader);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/userSettings/QTestProband1')
        .set(sysadminHeader);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 and return the users Settings', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/userSettings/QTestProband1')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.logging_active).to.equal(true);
      expect(result.body.links.self.href).to.equal(
        '/userSettings/QTestProband1'
      );
    });
  });
});
