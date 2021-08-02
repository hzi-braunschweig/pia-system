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

const { db } = require('../../src/db');
const { setupFile, cleanupFile } = require('./systemLogs.spec.data/sqlFiles');

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT + '/log';

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

describe('/log/systemLogs', () => {
  before(async () => {
    await server.init();
  });

  after(async () => {
    await server.stop();
  });

  describe('GET /log/systemLogs', async () => {
    const queryValidAll = `/systemLogs?types=sample&types=proband&types=partial&types=study&fromTime=1970-01-01&toTime=3000-01-01`;
    const queryValidEmptyFrom = `/systemLogs?types=sample&types=proband&types=partial&types=study&toTime=3000-01-01`;
    const queryValidEmptyTo = `/systemLogs?types=sample&types=proband&types=partial&types=study&fromTime=1970-01-01`;
    const queryValidShortTime = `/systemLogs?types=sample&types=proband&types=partial&types=study&fromTime=2001-01-01&toTime=2001-01-02`;
    const queryValidStudies = `/systemLogs?types=study&fromTime=1970-01-01&toTime=3000-01-01`;
    const queryValidCompliances = `/systemLogs?types=compliance&fromTime=1970-01-01&toTime=3000-01-01`;
    const queryValidProbands = `/systemLogs?types=proband&fromTime=1970-01-01&toTime=3000-01-01`;
    const queryValidSamples = `/systemLogs?types=sample&fromTime=1970-01-01&toTime=3000-01-01`;
    const queryValidPartials = `/systemLogs?types=partial&fromTime=1970-01-01&toTime=3000-01-01`;
    const queryWrongDate = `/systemLogs?types=sample&types=proband&types=partial&types=study&fromTime=1970-01-01&toTime=surelyNotADate`;
    const queryNoTypes = `/systemLogs?fromTime=1970-01-01&toTime=3000-01-01`;
    const queryWrongType = `/systemLogs?types=wrongType&types=proband&types=partial&types=study&fromTime=1970-01-01&toTime=3000-01-01`;

    before(async () => {
      await db.none(cleanupFile);
      await db.none(setupFile);
    });

    after(async function () {
      await db.none(cleanupFile);
    });

    it('should return 401 if the token is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidAll)
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return 403 if PM tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidAll)
        .set(pmHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a UT tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidAll)
        .set(utHeader);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if a forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidAll)
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 403 if proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidAll)
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return http 400 if a type is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryWrongType)
        .set(sysadminHeader);
      expect(result).to.have.status(400);
    });

    it('should return http 200 with empty array if no type is specified', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryNoTypes)
        .set(sysadminHeader);
      expect(result).to.have.status(400);
    });

    it('should return http 200 with empty array if a date is invalid', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryWrongDate)
        .set(sysadminHeader);
      expect(result).to.have.status(400);
    });

    it('should return http 200 with all logs', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidAll)
        .set(sysadminHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(20);
    });

    it('should return http 200 with all logs if fromTime is empty', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidEmptyFrom)
        .set(sysadminHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(20);
    });

    it('should return http 200 with all logs if toTime is empty', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidEmptyTo)
        .set(sysadminHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(20);
    });

    it('should return http 200 with all partial logs', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidPartials)
        .set(sysadminHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(5);
      expect(result.body[0].type).to.equal('partial');
      expect(result.body[1].type).to.equal('partial');
      expect(result.body[2].type).to.equal('partial');
      expect(result.body[3].type).to.equal('partial');
      expect(result.body[4].type).to.equal('partial');
    });

    it('should return http 200 with all probands logs', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidProbands)
        .set(sysadminHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(5);
      expect(result.body[0].type).to.equal('proband');
      expect(result.body[1].type).to.equal('proband');
      expect(result.body[2].type).to.equal('proband');
      expect(result.body[3].type).to.equal('proband');
      expect(result.body[4].type).to.equal('proband');
    });

    it('should return http 200 with all samples logs', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidSamples)
        .set(sysadminHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(5);
      expect(result.body[0].type).to.equal('sample');
      expect(result.body[1].type).to.equal('sample');
      expect(result.body[2].type).to.equal('sample');
      expect(result.body[3].type).to.equal('sample');
      expect(result.body[4].type).to.equal('sample');
    });

    it('should return http 200 with all studies logs', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidStudies)
        .set(sysadminHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(5);
      expect(result.body[0].type).to.equal('study');
      expect(result.body[1].type).to.equal('study');
      expect(result.body[2].type).to.equal('study');
      expect(result.body[3].type).to.equal('study');
      expect(result.body[4].type).to.equal('study');
    });

    it('should return http 200 with all compliance logs', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidCompliances)
        .set(sysadminHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(5);
      expect(result.body[0].type).to.equal('compliance');
      expect(result.body[1].type).to.equal('compliance');
      expect(result.body[2].type).to.equal('compliance');
      expect(result.body[3].type).to.equal('compliance');
      expect(result.body[4].type).to.equal('compliance');
    });

    it('should return http 200 with logs from certain timeframe', async () => {
      const result = await chai
        .request(apiAddress)
        .get(queryValidShortTime)
        .set(sysadminHeader);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(8);
    });
  });
});
