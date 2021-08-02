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
const JWT = require('jsonwebtoken');

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT + '/sample';

const { db } = require('../../src/db');

const probandSession1 = { id: 1, role: 'Proband', username: 'QTestProband1' };
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
const forscherHeader1 = { authorization: forscherToken1 };
const utHeader = { authorization: utToken };
const pmHeader = { authorization: pmToken };
const sysadminHeader = { authorization: sysadminToken };

const resultsProband1 = {
  id: 99999,
  user_id: 'QTestProband1',
  sample_id: 'ZIFCO-1234567899',
  blood_sample_carried_out: true,
  remark: 'This is as simple comment',
};

const resultsProband2 = {
  id: 99998,
  user_id: 'QTestProband2',
  sample_id: 'ZIFCO-1234567890',
  blood_sample_carried_out: false,
  remark: 'This is another simple comment',
};

describe('/sample/probands/id/bloodSamples', () => {
  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
  });

  describe('GET /sample/probands/id/bloodSamples', async () => {
    async function resetDb() {
      await db.none(
        'DELETE FROM blood_samples WHERE sample_id=$1 OR sample_id=$2 OR sample_id=$3',
        ['ZIFCO-1234567890', 'ZIFCO-1234567899', 'ZIFCO-1111111111']
      );
      await db.none(
        'DELETE FROM study_users WHERE user_id=$1 OR user_id=$2 OR user_id=$3 OR user_id=$4 OR user_id=$5',
        [
          'QTestProband1',
          'QTestForscher1',
          'QTestProband2',
          'QTestProbandenManager',
          'QTestUntersuchungsteam',
        ]
      );
      await db.none(
        'DELETE FROM users WHERE username=$1 OR username=$2 OR username=$3 OR username=$4 OR username=$5 OR username=$6',
        [
          'QTestProband1',
          'QTestProband2',
          'QTestProbandenManager',
          'QTestForscher1',
          'QTestUntersuchungsteam',
          'QTestSystemAdmin',
        ]
      );
      await db.none('DELETE FROM studies WHERE name IN($1:csv)', [
        [
          'ApiTestStudie',
          'ApiTestStudie2',
          'ApiTestMultiProband',
          'ApiTestMultiProf',
        ],
      ]);
    }

    before(async () => {
      await resetDb();

      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          'justarandomstring',
          null,
          null,
          'android',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband2',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          '',
          null,
          null,
          null,
          false,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestForscher1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Forscher',
          'justarandomstring',
          null,
          null,
          'web',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProbandenManager',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'ProbandenManager',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestUntersuchungsteam',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Untersuchungsteam',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestSystemAdmin',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'SysAdmin',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie', 'ApiTestStudie Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1, $2)', [
        'ApiTestMultiProband',
        'ApiTestMultiProband Beschreibung',
      ]);
      await db.none('INSERT INTO studies VALUES ($1, $2)', [
        'ApiTestMultiProf',
        'ApiTestMultiProf Beschreibung',
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'QTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestForscher1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProbandenManager', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestUntersuchungsteam', 'read'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestForscher1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestProbandenManager', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestUntersuchungsteam', 'read'],
      ]);

      await db.none('INSERT INTO blood_samples VALUES ($1:csv)', [
        [
          99999,
          'QTestProband1',
          'ZIFCO-1234567899',
          true,
          'This is as simple comment',
        ],
      ]);
      await db.none('INSERT INTO blood_samples VALUES ($1:csv)', [
        [
          99998,
          'QTestProband2',
          'ZIFCO-1234567890',
          false,
          'This is another simple comment',
        ],
      ]);
    });

    after(async function () {
      await resetDb();
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/bloodSamples')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/bloodSamples')
        .set(sysadminHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/bloodSamples')
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 404 if PM tries for proband not in his study', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband2/bloodSamples')
        .set(pmHeader);
      expect(result).to.have.status(404);
    });

    it('should return http 404 if PM tries for nonexisting Proband', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/NOTAPROBAND/bloodSamples')
        .set(pmHeader);
      expect(result).to.have.status(404);
    });

    it('should return blood samples from database for PM', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/bloodSamples')
        .set(pmHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(1);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
    });

    it('should return blood samples from database for UT', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/bloodSamples')
        .set(utHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(1);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
    });

    it('should return blood samples from database for Forscher', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/bloodSamples')
        .set(forscherHeader1);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(1);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
    });
  });

  describe('GET /sample/bloodResult/sample_id', async () => {
    async function resetDb() {
      await db.none(
        'DELETE FROM blood_samples WHERE sample_id=$1 OR sample_id=$2 OR sample_id=$3',
        ['ZIFCO-1234567890', 'ZIFCO-1234567899', 'ZIFCO-1111111111']
      );
      await db.none(
        'DELETE FROM study_users WHERE user_id=$1 OR user_id=$2 OR user_id=$3 OR user_id=$4 OR user_id=$5',
        [
          'QTestProband1',
          'QTestForscher1',
          'QTestProband2',
          'QTestProbandenManager',
          'QTestUntersuchungsteam',
        ]
      );
      await db.none(
        'DELETE FROM users WHERE username=$1 OR username=$2 OR username=$3 OR username=$4 OR username=$5 OR username=$6',
        [
          'QTestProband1',
          'QTestProband2',
          'QTestProbandenManager',
          'QTestForscher1',
          'QTestUntersuchungsteam',
          'QTestSystemAdmin',
        ]
      );
      await db.none('DELETE FROM studies WHERE name IN($1:csv)', [
        [
          'ApiTestStudie',
          'ApiTestStudie2',
          'ApiTestMultiProband',
          'ApiTestMultiProf',
        ],
      ]);
    }

    before(async () => {
      await resetDb();

      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          'justarandomstring',
          null,
          null,
          'android',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband2',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          '',
          null,
          null,
          null,
          false,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestForscher1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Forscher',
          'justarandomstring',
          null,
          null,
          'web',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProbandenManager',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'ProbandenManager',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestUntersuchungsteam',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Untersuchungsteam',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestSystemAdmin',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'SysAdmin',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie', 'ApiTestStudie Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1, $2)', [
        'ApiTestMultiProband',
        'ApiTestMultiProband Beschreibung',
      ]);
      await db.none('INSERT INTO studies VALUES ($1, $2)', [
        'ApiTestMultiProf',
        'ApiTestMultiProf Beschreibung',
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'QTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestForscher1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProbandenManager', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestUntersuchungsteam', 'read'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestForscher1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestProbandenManager', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestUntersuchungsteam', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestForscher1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestUntersuchungsteam', 'read'],
      ]);

      await db.none('INSERT INTO blood_samples VALUES ($1:csv)', [
        [
          99999,
          'QTestProband1',
          'ZIFCO-1234567899',
          true,
          'This is as simple comment',
        ],
      ]);
      await db.none('INSERT INTO blood_samples VALUES ($1:csv)', [
        [
          99998,
          'QTestProband2',
          'ZIFCO-1234567890',
          false,
          'This is another simple comment',
        ],
      ]);
    });

    after(async function () {
      await resetDb();
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a QTestProband1 tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(sysadminHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a UT tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(utHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 404 if a PM is not in same study as Proband', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband2.sample_id)
        .set(pmHeader);
      expect(result).to.have.status(404);
    });

    it('should return blood samples from database for PM', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/bloodResult/' + resultsProband1.sample_id)
        .set(pmHeader);
      expect(result).to.have.status(200);

      expect(result.body.length).to.equal(1);
      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
      expect(result.body[0].remark).to.equal(resultsProband1.remark);
    });
  });

  describe('GET /sample/probands/id/bloodSamples/id', async () => {
    async function resetDb() {
      await db.none(
        'DELETE FROM blood_samples WHERE sample_id=$1 OR sample_id=$2 OR sample_id=$3',
        ['ZIFCO-1234567890', 'ZIFCO-1234567899', 'ZIFCO-1111111111']
      );
      await db.none(
        'DELETE FROM study_users WHERE user_id=$1 OR user_id=$2 OR user_id=$3 OR user_id=$4 OR user_id=$5',
        [
          'QTestProband1',
          'QTestForscher1',
          'QTestProband2',
          'QTestProbandenManager',
          'QTestUntersuchungsteam',
        ]
      );
      await db.none(
        'DELETE FROM users WHERE username=$1 OR username=$2 OR username=$3 OR username=$4 OR username=$5 OR username=$6',
        [
          'QTestProband1',
          'QTestProband2',
          'QTestProbandenManager',
          'QTestForscher1',
          'QTestUntersuchungsteam',
          'QTestSystemAdmin',
        ]
      );
      await db.none('DELETE FROM studies WHERE name IN($1:csv)', [
        [
          'ApiTestStudie',
          'ApiTestStudie2',
          'ApiTestMultiProband',
          'ApiTestMultiProf',
        ],
      ]);
    }

    before(async () => {
      await resetDb();

      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          'justarandomstring',
          null,
          null,
          'android',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband2',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          '',
          null,
          null,
          null,
          false,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestForscher1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Forscher',
          'justarandomstring',
          null,
          null,
          'web',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProbandenManager',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'ProbandenManager',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestUntersuchungsteam',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Untersuchungsteam',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestSystemAdmin',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'SysAdmin',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie', 'ApiTestStudie Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1, $2)', [
        'ApiTestMultiProband',
        'ApiTestMultiProband Beschreibung',
      ]);
      await db.none('INSERT INTO studies VALUES ($1, $2)', [
        'ApiTestMultiProf',
        'ApiTestMultiProf Beschreibung',
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'QTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestForscher1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProbandenManager', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestUntersuchungsteam', 'read'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestForscher1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestProbandenManager', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestUntersuchungsteam', 'read'],
      ]);

      await db.none('INSERT INTO blood_samples VALUES ($1:csv)', [
        [
          99999,
          'QTestProband1',
          'ZIFCO-1234567899',
          true,
          'This is as simple comment',
        ],
      ]);
      await db.none('INSERT INTO blood_samples VALUES ($1:csv)', [
        [
          99998,
          'QTestProband2',
          'ZIFCO-1234567890',
          false,
          'This is another simple comment',
        ],
      ]);
    });

    after(async function () {
      await resetDb();
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .get(
          '/probands/QTestProband1/bloodSamples/' + resultsProband1.sample_id
        )
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a QTestProband1 tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get(
          '/probands/QTestProband1/bloodSamples/' + resultsProband1.sample_id
        )
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a sysadmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get(
          '/probands/QTestProband1/bloodSamples/' + resultsProband1.sample_id
        )
        .set(sysadminHeader);
      expect(result).to.have.status(403);
    });

    it('should return blood samples from database for UT', async () => {
      const result = await chai
        .request(apiAddress)
        .get(
          '/probands/QTestProband1/bloodSamples/' + resultsProband1.sample_id
        )
        .set(utHeader);
      expect(result).to.have.status(200);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
      expect(result.body[0].remark).to.equal(resultsProband1.remark);
    });

    it('should return blood samples from database for PM', async () => {
      const result = await chai
        .request(apiAddress)
        .get(
          '/probands/QTestProband1/bloodSamples/' + resultsProband1.sample_id
        )
        .set(pmHeader);
      expect(result).to.have.status(200);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
      expect(result.body[0].remark).to.equal(resultsProband1.remark);
    });

    it('should return blood samples from database for Forscher', async () => {
      const result = await chai
        .request(apiAddress)
        .get(
          '/probands/QTestProband1/bloodSamples/' + resultsProband1.sample_id
        )
        .set(forscherHeader1);
      expect(result).to.have.status(200);

      expect(result.body[0].id).to.equal(resultsProband1.id);
      expect(result.body[0].user_id).to.equal(resultsProband1.user_id);
      expect(result.body[0].sample_id).to.equal(resultsProband1.sample_id);
      expect(result.body[0].remark).to.equal(resultsProband1.remark);
    });
  });

  describe('POST /sample/probands/id/bloodSamples', async () => {
    const validBloodSample = {
      sample_id: 'ZIFCO-1234567890',
    };

    const inValidBloodSample1 = {};

    const inValidBloodSample2 = {
      sample_id: 'ApiTest-123456789',
      wrong_param: 'something',
    };

    async function resetDb() {
      await db.none(
        'DELETE FROM blood_samples WHERE sample_id=$1 OR sample_id=$2 OR sample_id=$3',
        ['ZIFCO-1234567890', 'ZIFCO-1234567899', 'ZIFCO-1111111111']
      );
      await db.none('DELETE FROM study_users WHERE user_id IN($1:csv)', [
        [
          'QTestProband1',
          'QTestForscher1',
          'QTestProband2',
          'QTestProband3',
          'QTestProband4',
          'QTestProbandenManager',
          'QTestUntersuchungsteam',
        ],
      ]);
      await db.none('DELETE FROM users WHERE username IN($1:csv)', [
        [
          'QTestProband1',
          'QTestProband2',
          'QTestProband3',
          'QTestProband4',
          'QTestProbandenManager',
          'QTestForscher1',
          'QTestUntersuchungsteam',
          'QTestSystemAdmin',
        ],
      ]);
      await db.none('DELETE FROM studies WHERE name IN($1:csv)', [
        [
          'ApiTestStudie',
          'ApiTestStudie2',
          'ApiTestMultiProband',
          'ApiTestMultiProf',
        ],
      ]);
    }

    before(async () => {
      await resetDb();

      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          'justarandomstring',
          null,
          null,
          'android',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband2',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband3',
          '',
          'Proband',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          'deactivated',
          'active',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband4',
          '',
          'Proband',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          'deleted',
          'deleted',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestForscher1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Forscher',
          'justarandomstring',
          null,
          null,
          'web',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProbandenManager',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'ProbandenManager',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestUntersuchungsteam',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Untersuchungsteam',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestSystemAdmin',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'SysAdmin',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie', 'ApiTestStudie Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1, $2)', [
        'ApiTestMultiProband',
        'ApiTestMultiProband Beschreibung',
      ]);
      await db.none('INSERT INTO studies VALUES ($1, $2)', [
        'ApiTestMultiProf',
        'ApiTestMultiProf Beschreibung',
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProband3', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProband4', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'QTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestForscher1', 'read'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestForscher1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestProbandenManager', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestUntersuchungsteam', 'read'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProbandenManager', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestUntersuchungsteam', 'read'],
      ]);
    });

    after(async function () {
      await resetDb();
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/bloodSamples')
        .set(invalidHeader)
        .send(validBloodSample);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a Forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/bloodSamples')
        .set(forscherHeader1)
        .send(validBloodSample);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/bloodSamples')
        .set(probandHeader1)
        .send(validBloodSample);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a PM tries for Proband that is not in his study', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband2/bloodSamples')
        .set(pmHeader)
        .send(validBloodSample);
      expect(result).to.have.status(403);
    });

    it('should return http 400 if a UT tries but sample_id is missing', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/bloodSamples')
        .set(pmHeader)
        .send(inValidBloodSample1);
      expect(result).to.have.status(400);
    });

    it('should return http 400 if a UT tries but blood sample has wrong params', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/bloodSamples')
        .set(pmHeader)
        .send(inValidBloodSample2);
      expect(result).to.have.status(400);
    });

    it('should return http 403 if a UT tries for deleted proband', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband3/bloodSamples')
        .set(pmHeader)
        .send(validBloodSample);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a UT tries for deactivated proband', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband4/bloodSamples')
        .set(pmHeader)
        .send(validBloodSample);
      expect(result).to.have.status(403);
    });

    it('should return http 200 and create the BloodSample for UT', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/probands/QTestProband1/bloodSamples')
        .set(utHeader)
        .send(validBloodSample);
      expect(result).to.have.status(200);
      expect(result.body.sample_id).to.equal(validBloodSample.sample_id);
      expect(result.body.user_id).to.equal('QTestProband1');
      expect(result.body.blood_sample_carried_out).to.equal(null);
      expect(result.body.remark).to.equal(null);
    });
  });

  describe('PUT /sample/probands/id/bloodSamples/id', async () => {
    const validBloodSampleUT1 = {
      blood_sample_carried_out: true,
    };

    const validUpdateBloodSampleUT2 = {
      remark: 'Beware of the monster under your bed!',
    };

    const validBloodSampleUT2 = {
      blood_sample_carried_out: true,
      remark: 'Beware of the monster under your bed!',
    };

    const inValidBloodSample1 = {};

    const inValidBloodSample2 = {
      remark: 'Beware of the monster under your bed!',
      blood_sample_carried_out: true,
      wrong_param: 'something',
    };

    async function resetDb() {
      await db.none('DELETE FROM blood_samples WHERE sample_id IN ($1:csv)', [
        [
          'ZIFCO-1234567890',
          'ZIFCO-1234567899',
          'ZIFCO-1111111111',
          'ZIFCO-1234567891',
          'ZIFCO-1234567892',
        ],
      ]);
      await db.none('DELETE FROM study_users WHERE user_id IN($1:csv)', [
        [
          'QTestProband1',
          'QTestForscher1',
          'QTestProband2',
          'QTestProband3',
          'QTestProband4',
          'QTestProbandenManager',
          'QTestUntersuchungsteam',
        ],
      ]);
      await db.none('DELETE FROM users WHERE username IN($1:csv)', [
        [
          'QTestProband1',
          'QTestProband2',
          'QTestProband3',
          'QTestProband4',
          'QTestProbandenManager',
          'QTestForscher1',
          'QTestUntersuchungsteam',
          'QTestSystemAdmin',
        ],
      ]);
      await db.none('DELETE FROM studies WHERE name IN($1:csv)', [
        [
          'ApiTestStudie',
          'ApiTestStudie2',
          'ApiTestMultiProband',
          'ApiTestMultiProf',
        ],
      ]);
    }

    before(async () => {
      await resetDb();

      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          'justarandomstring',
          null,
          null,
          'android',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband2',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          '',
          null,
          null,
          null,
          false,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestForscher1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Forscher',
          'justarandomstring',
          null,
          null,
          'web',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProbandenManager',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'ProbandenManager',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestUntersuchungsteam',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Untersuchungsteam',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestSystemAdmin',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'SysAdmin',
          '',
          null,
          null,
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband3',
          '',
          'Proband',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          'deactivated',
          'active',
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'QTestProband4',
          '',
          'Proband',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          'deleted',
          'deleted',
        ],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie', 'ApiTestStudie Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1, $2)', [
        'ApiTestMultiProband',
        'ApiTestMultiProband Beschreibung',
      ]);
      await db.none('INSERT INTO studies VALUES ($1, $2)', [
        'ApiTestMultiProf',
        'ApiTestMultiProf Beschreibung',
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProband3', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProband4', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'QTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestForscher1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestProbandenManager', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie', 'QTestUntersuchungsteam', 'read'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestProband3', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestProband4', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'QTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestForscher1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestProbandenManager', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'QTestUntersuchungsteam', 'read'],
      ]);

      await db.none('INSERT INTO blood_samples VALUES ($1:csv)', [
        [99999, 'QTestProband1', 'ZIFCO-1234567899', null, null],
      ]);
      await db.none('INSERT INTO blood_samples VALUES ($1:csv)', [
        [99998, 'QTestProband2', 'ZIFCO-1234567890', true, null],
      ]);
      await db.none('INSERT INTO blood_samples VALUES ($1:csv)', [
        [99997, 'QTestProband3', 'ZIFCO-1234567891', null, null],
      ]);
      await db.none('INSERT INTO blood_samples VALUES ($1:csv)', [
        [99996, 'QTestProband4', 'ZIFCO-1234567892', null, null],
      ]);
    });

    after(async function () {
      await resetDb();
    });

    it('should return http 401 if the header is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1234567899')
        .set(invalidHeader)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(401);
    });

    it('should return http 403 if a Forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1234567899')
        .set(forscherHeader1)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a PM tries', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband2/bloodSamples/ZIFCO-1234567899')
        .set(pmHeader)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a UT tries for Proband that is not in his study', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband2/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(403);
    });

    it('should return http 409 if a UT tries for nonexisting blood sample', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1111111111')
        .set(utHeader)
        .send(validBloodSampleUT1);
      expect(result).to.have.status(409);
    });

    it('should return http 403 if a UT tries but update params are wrong', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(inValidBloodSample1);
      expect(result).to.have.status(403);
    });

    it('should return http 400 if a UT tries but blood sample has wrong params', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(inValidBloodSample2);
      expect(result).to.have.status(400);
    });

    it('should return http 400 if a UT tries but proband was deleted', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband3/bloodSamples/ZIFCO-1234567891')
        .set(utHeader)
        .send(inValidBloodSample2);
      expect(result).to.have.status(400);
    });

    it('should return http 400 if a UT tries but proband was deactivated', async () => {
      const result = await chai
        .request(apiAddress)
        .put('/probands/QTestProband4/bloodSamples/ZIFCO-1234567892')
        .set(utHeader)
        .send(inValidBloodSample2);
      expect(result).to.have.status(400);
    });

    it('should return http 200 and update blood sample blood_sample_carried_out for UT', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(validBloodSampleUT1);
      expect(result1).to.have.status(200);
      expect(result1.body.blood_sample_carried_out).to.equal(
        validBloodSampleUT1.blood_sample_carried_out
      );
    });

    it('should return http 409 because blood sample with blood_sample_carried_out is true already exist for UT', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1234567890')
        .set(utHeader)
        .send(validBloodSampleUT1);
      expect(result1).to.have.status(409);
    });

    it('should return http 200 and change blood sample remark for UT', async () => {
      const result1 = await chai
        .request(apiAddress)
        .put('/probands/QTestProband1/bloodSamples/ZIFCO-1234567899')
        .set(utHeader)
        .send(validUpdateBloodSampleUT2);
      expect(result1).to.have.status(200);
      expect(result1.body.remark).to.equal(validBloodSampleUT2.remark);
      expect(result1.body.blood_sample_carried_out).to.equal(
        validBloodSampleUT2.blood_sample_carried_out
      );
    });
  });
});
