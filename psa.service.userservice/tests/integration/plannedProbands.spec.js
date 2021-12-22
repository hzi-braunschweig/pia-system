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

const { setup, cleanup } = require('./plannedProbands.spec.data/setup.helper');

const JWT = require('jsonwebtoken');

const { Server } = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT + '/user';

const probandSession1 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband1',
  groups: ['ApiTestStudie'],
};
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
  groups: ['ApiTestStudie', 'ApiTestStudie2', 'ApiTestMultiProf'],
};
const utSession1 = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'ut@apitest.de',
  groups: ['ApiTestStudie', 'ApiTestMultiProf'],
};
const utSession2 = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'ut2@apitest.de',
  groups: ['ApiTestStudie2'],
};
const sysadminSession = {
  id: 1,
  role: 'SysAdmin',
  username: 'QTestSystemAdmin',
};
const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
  groups: ['ApiTestStudie', 'ApiTestMultiProf'],
};

const invalidToken = JWT.sign(probandSession1, 'thisIsNotAValidPrivateKey', {
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
const utToken1 = JWT.sign(utSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const utToken2 = JWT.sign(utSession2, secretOrPrivateKey, {
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
const forscherHeader1 = { authorization: forscherToken1 };
const utHeader1 = { authorization: utToken1 };
const utHeader2 = { authorization: utToken2 };
const sysadminHeader = { authorization: sysadminToken };
const pmHeader = { authorization: pmToken };

describe('/plannedprobands', function () {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('GET plannedprobands', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 404 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands')
        .set(probandHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a PM tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands')
        .set(pmHeader);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands')
        .set(forscherHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands')
        .set(sysadminHeader);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 with empty array if user has no planned probands in study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands')
        .set(utHeader2);
      expect(result).to.have.status(200);
      expect(result.body.plannedprobands.length).to.equal(0);
      expect(result.body.links.self.href).to.equal('/plannedprobands');
    });

    it('should return HTTP 200 with planned probands from correct study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands')
        .set(utHeader1);
      expect(result).to.have.status(200);
      expect(result.body.plannedprobands.length).to.equal(2);
      expect(result.body.plannedprobands[0].user_id).to.equal('planned1');
      expect(result.body.plannedprobands[0].password).to.equal('aPassword1');
      expect(result.body.plannedprobands[0].activated_at).to.not.equal(null);
      expect(result.body.plannedprobands[0].study_accesses.length).to.equal(2);
      expect(result.body.plannedprobands[1].user_id).to.equal('planned2');
      expect(result.body.plannedprobands[1].password).to.equal('aPassword2');
      expect(result.body.plannedprobands[1].activated_at).to.equal(null);
      expect(result.body.plannedprobands[1].study_accesses.length).to.equal(1);
      expect(result.body.links.self.href).to.equal('/plannedprobands');
    });
  });

  describe('GET plannedprobands/{user_id}', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands/planned1')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 404 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands/planned1')
        .set(probandHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a PM tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands/planned1')
        .set(pmHeader);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands/planned1')
        .set(forscherHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands/planned1')
        .set(sysadminHeader);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a ut tries who is not in correct study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands/planned1')
        .set(utHeader2);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a ut tries for planned proband without a study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands/planned3')
        .set(utHeader2);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a ut tries for non existing planned proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands/plannedwrong')
        .set(utHeader2);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 with correct planned proband object', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/plannedprobands/planned1')
        .set(utHeader1);
      expect(result).to.have.status(200);
      expect(result.body.user_id).to.equal('planned1');
      expect(result.body.password).to.equal('aPassword1');
      expect(result.body.activated_at).to.not.equal(null);
      expect(result.body.study_accesses.length).to.equal(2);
      expect(result.body.links.self.href).to.equal('/plannedprobands/planned1');
    });
  });

  describe('DELETE plannedprobands/{user_id}', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/plannedprobands/planned1')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(401);
    });

    it('should return HTTP 404 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/plannedprobands/planned1')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a PM tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/plannedprobands/planned1')
        .set(pmHeader)
        .send({});
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/plannedprobands/planned1')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/plannedprobands/planned1')
        .set(sysadminHeader)
        .send({});
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a ut tries who is not in correct study', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/plannedprobands/planned1')
        .set(utHeader2)
        .send({});
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a ut tries for planned proband without a study', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/plannedprobands/planned3')
        .set(utHeader2)
        .send({});
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a ut tries for non existing planned proband', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/plannedprobands/plannedwrong')
        .set(utHeader2)
        .send({});
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 with correct planned proband object and delete the proband', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/plannedprobands/planned1')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(200);
      expect(result.body.user_id).to.equal('planned1');
      expect(result.body.password).to.equal('aPassword1');
      expect(result.body.activated_at).to.not.equal(null);
      expect(result.body.links.self.href).to.equal('/plannedprobands/planned1');
      const result2 = await chai
        .request(apiAddress)
        .get('/plannedprobands/planned1')
        .set(utHeader1);
      expect(result2).to.have.status(404);
    });
  });

  describe('POST plannedprobands', function () {
    beforeEach(async function () {
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    const pseudonyms = [
      'planned1',
      'planned2',
      'planned3',
      'planned4',
      'planned5',
    ];

    const duplicates = ['planned4', 'planned4', 'planned4'];

    const duplicates2 = ['planned4', 'QTestProband1'];

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/plannedprobands')
        .set(invalidHeader)
        .send({ pseudonyms: pseudonyms });
      expect(result).to.have.status(401);
    });

    it('should return HTTP 404 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/plannedprobands')
        .set(probandHeader1)
        .send({ pseudonyms: pseudonyms });
      expect(result).to.have.status(409);
    });

    it('should return HTTP 404 if a PM tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/plannedprobands')
        .set(pmHeader)
        .send({ pseudonyms: pseudonyms });
      expect(result).to.have.status(409);
    });

    it('should return HTTP 404 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/plannedprobands')
        .set(forscherHeader1)
        .send({ pseudonyms: pseudonyms });
      expect(result).to.have.status(409);
    });

    it('should return HTTP 404 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/plannedprobands')
        .set(sysadminHeader)
        .send({ pseudonyms: pseudonyms });
      expect(result).to.have.status(409);
    });

    it('should return HTTP 400 if an empty array is sent', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/plannedprobands')
        .set(utHeader1)
        .send({ pseudonyms: [] });
      expect(result).to.have.status(400);
    });

    it('should return HTTP 200 and add only one of duplicate pseudonyms', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/plannedprobands')
        .set(utHeader1)
        .send({ pseudonyms: duplicates });
      expect(result).to.have.status(200);
      expect(result.body.plannedprobands.length).to.equal(3);
      expect(result.body.plannedprobands[0].wasCreated).to.equal(true);
      expect(result.body.plannedprobands[1].wasCreated).to.equal(false);
      expect(result.body.plannedprobands[2].wasCreated).to.equal(false);

      const result2 = await chai
        .request(apiAddress)
        .get('/plannedprobands')
        .set(utHeader1);
      expect(result2.body.plannedprobands.length).to.equal(3);
    });

    it('should return HTTP 200 and add only one of pseudonyms because the other one is associated with an existing proband', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/plannedprobands')
        .set(utHeader1)
        .send({ pseudonyms: duplicates2 });
      expect(result).to.have.status(200);
      expect(result.body.plannedprobands.length).to.equal(2);
      expect(result.body.plannedprobands[0].wasCreated).to.equal(true);
      expect(result.body.plannedprobands[1].wasCreated).to.equal(false);

      const result2 = await chai
        .request(apiAddress)
        .get('/plannedprobands')
        .set(utHeader1);
      expect(result2.body.plannedprobands.length).to.equal(3);
    });

    it('should return HTTP 200 and add only pseudonyms that were not present before', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/plannedprobands')
        .set(utHeader1)
        .send({ pseudonyms: pseudonyms });
      expect(result).to.have.status(200);
      expect(result.body.plannedprobands.length).to.equal(5);
      const plannedProbandsSorted = result.body.plannedprobands.sort((a, b) =>
        a.user_id > b.user_id ? 1 : a.user_id < b.user_id ? -1 : 0
      );
      expect(plannedProbandsSorted[0].wasCreated).to.equal(false);
      expect(plannedProbandsSorted[0].user_id).to.equal('planned1');
      expect(plannedProbandsSorted[0].study_accesses.length).to.equal(0);
      expect(plannedProbandsSorted[1].wasCreated).to.equal(false);
      expect(plannedProbandsSorted[1].user_id).to.equal('planned2');
      expect(plannedProbandsSorted[1].study_accesses.length).to.equal(0);
      expect(plannedProbandsSorted[2].wasCreated).to.equal(false);
      expect(plannedProbandsSorted[2].user_id).to.equal('planned3');
      expect(plannedProbandsSorted[2].study_accesses.length).to.equal(0);
      expect(plannedProbandsSorted[3].wasCreated).to.equal(true);
      expect(plannedProbandsSorted[3].user_id).to.equal('planned4');
      expect(plannedProbandsSorted[3].study_accesses.length).to.equal(2);
      expect(
        plannedProbandsSorted[3].study_accesses.some(
          (sa) => sa.study_id === 'ApiTestMultiProf'
        )
      ).to.be.true;
      expect(
        plannedProbandsSorted[3].study_accesses.some(
          (sa) => sa.study_id === 'ApiTestStudie'
        )
      ).to.be.true;
      expect(plannedProbandsSorted[4].wasCreated).to.equal(true);
      expect(plannedProbandsSorted[4].user_id).to.equal('planned5');
      expect(plannedProbandsSorted[4].study_accesses.length).to.equal(2);
      expect(
        plannedProbandsSorted[4].study_accesses.some(
          (sa) => sa.study_id === 'ApiTestMultiProf'
        )
      ).to.be.true;
      expect(
        plannedProbandsSorted[4].study_accesses.some(
          (sa) => sa.study_id === 'ApiTestStudie'
        )
      ).to.be.true;

      const result2 = await chai
        .request(apiAddress)
        .get('/plannedprobands')
        .set(utHeader1);
      expect(result2.body.plannedprobands.length).to.equal(4);
    });

    it('should return HTTP 200 and only assign the studies of the requesting ut', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/plannedprobands')
        .set(utHeader2)
        .send({ pseudonyms: pseudonyms });
      expect(result).to.have.status(200);

      expect(result.body.plannedprobands.length).to.equal(5);
      expect(result.body.plannedprobands[0].wasCreated).to.equal(false);
      expect(result.body.plannedprobands[0].user_id).to.equal('planned1');
      expect(result.body.plannedprobands[0].study_accesses.length).to.equal(0);
      expect(result.body.plannedprobands[1].wasCreated).to.equal(false);
      expect(result.body.plannedprobands[1].user_id).to.equal('planned2');
      expect(result.body.plannedprobands[1].study_accesses.length).to.equal(0);
      expect(result.body.plannedprobands[2].wasCreated).to.equal(false);
      expect(result.body.plannedprobands[2].user_id).to.equal('planned3');
      expect(result.body.plannedprobands[2].study_accesses.length).to.equal(0);
      expect(result.body.plannedprobands[3].wasCreated).to.equal(true);
      expect(result.body.plannedprobands[3].user_id).to.equal('planned4');
      expect(result.body.plannedprobands[3].study_accesses.length).to.equal(1);
      expect(
        result.body.plannedprobands[3].study_accesses[0].study_id
      ).to.equal('ApiTestStudie2');
      expect(result.body.plannedprobands[4].wasCreated).to.equal(true);
      expect(result.body.plannedprobands[4].user_id).to.equal('planned5');
      expect(result.body.plannedprobands[4].study_accesses.length).to.equal(1);
      expect(
        result.body.plannedprobands[4].study_accesses[0].study_id
      ).to.equal('ApiTestStudie2');

      const result2 = await chai
        .request(apiAddress)
        .get('/plannedprobands')
        .set(utHeader1);
      expect(result2.body.plannedprobands.length).to.equal(2);
    });

    it('should return 200 but prevent to create a planned proband with a pseudonym that already exists with another spelling', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/plannedprobands')
        .set(utHeader2)
        .send({ pseudonyms: ['QTESTProband1', 'PLANned1'] });
      result.body.plannedprobands.forEach((plannedProband) => {
        delete plannedProband.password;
      });
      expect(result.body.plannedprobands).to.deep.include.members([
        {
          user_id: 'QTESTProband1',
          activated_at: null,
          study_accesses: [],
          wasCreated: false,
        },
        {
          user_id: 'PLANned1',
          activated_at: null,
          study_accesses: [],
          wasCreated: false,
        },
      ]);
    });
  });
});
