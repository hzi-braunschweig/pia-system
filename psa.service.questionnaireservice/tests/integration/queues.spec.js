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

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const probandHeader2 = { authorization: probandToken2 };
const forscherHeader1 = { authorization: forscherToken1 };

describe('/probands/user_id/queues', function () {
  before(async function () {
    await server.init();
    await setup();
  });

  after(async function () {
    await server.stop();
    await cleanup();
  });

  describe('GET probands/user_id/queues', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/queues')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if the user_id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/nonexistingUser/queues')
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if proband asks for other proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/queues')
        .set(probandHeader2);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a Forscher tries ', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/queues')
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 with the correct queues in correct order if the correct Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/queues')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.queues.length).to.equal(4);
      expect(result.body.queues[0].user_id).to.equal('QTestProband1');
      expect(result.body.queues[0].questionnaire_instance_id).to.not.equal(
        undefined
      );
      expect(result.body.queues[0].date_of_queue).to.not.equal(undefined);
      expect(result.body.queues[0].user_id).to.equal('QTestProband1');
      expect(
        result.body.queues[0].date_of_queue >
          result.body.queues[1].date_of_queue
      ).to.equal(true);
      expect(
        result.body.queues[1].date_of_queue >
          result.body.queues[2].date_of_queue
      ).to.equal(true);
      expect(
        result.body.queues[2].date_of_queue >
          result.body.queues[3].date_of_queue
      ).to.equal(true);
      expect(result.body.links.self.href).to.equal(
        '/probands/QTestProband1/queues'
      );
    });

    it('should return HTTP 200 empty array if proband tries that has no queues', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestProband2/queues')
        .set(probandHeader2);
      expect(result).to.have.status(200);
      expect(result.body.queues.length).to.equal(0);
      expect(result.body.links.self.href).to.equal(
        '/probands/QTestProband2/queues'
      );
    });
  });

  describe('DELETE probands/user_id/queues/instance_id', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/QTestProband1/queues/99996')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if the user_id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/nonexistingUser/queues/99996')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if the instance_id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/QTestProband1/queues/3298789')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if proband tries for other proband', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/QTestProband1/queues/99996')
        .set(probandHeader2)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a Forscher tries ', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/QTestProband1/queues/99996')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 and delete correct queue', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/QTestProband1/queues/99996')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(200);
      expect(result.body.user_id).to.equal('QTestProband1');
      expect(result.body.questionnaire_instance_id).to.equal(99996);
      expect(result.body.links.self.href).to.equal(
        '/probands/QTestProband1/queues/99996'
      );
      const result2 = await chai
        .request(apiAddress)
        .get('/probands/QTestProband1/queues')
        .set(probandHeader1);
      expect(result2).to.have.status(200);
      expect(result2.body.queues.length).to.equal(3);
      expect(result2.body.queues[0].questionnaire_instance_id).to.not.equal(
        99996
      );
      expect(result2.body.queues[1].questionnaire_instance_id).to.not.equal(
        99996
      );
      expect(result2.body.queues[2].questionnaire_instance_id).to.not.equal(
        99996
      );
    });
  });
});
