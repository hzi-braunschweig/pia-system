/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import JWT from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

import secretOrPrivateKey from '../secretOrPrivateKey';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { cleanup, setup } from './queues.spec.data/setup.helper';

chai.use(chaiHttp);

const apiAddress =
  'http://localhost:' + config.public.port.toString() + '/questionnaire';

const probandSession1 = {
  id: 1,
  role: 'Proband',
  username: 'QTestStudieProband1',
};
const probandSession2 = {
  id: 1,
  role: 'Proband',
  username: 'QTestStudi2Proband2',
};
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
    await Server.init();
    await setup();
  });

  after(async function () {
    await Server.stop();
    await cleanup();
  });

  describe('GET probands/user_id/queues', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestStudieProband1/queues')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if the user_id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/nonexistingUser/queues')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if proband asks for other proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestStudieProband1/queues')
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries ', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestStudieProband1/queues')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with the correct queues in correct order if the correct Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestStudieProband1/queues')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.queues.length).to.equal(4);
      expect(result.body.queues[0].user_id).to.equal('QTestStudieProband1');
      expect(result.body.queues[0].questionnaire_instance_id).to.not.equal(
        undefined
      );
      expect(result.body.queues[0].date_of_queue).to.not.equal(undefined);
      expect(result.body.queues[0].user_id).to.equal('QTestStudieProband1');
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
    });

    it('should return HTTP 200 empty array if proband tries that has no queues', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/QTestStudi2Proband2/queues')
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.queues.length).to.equal(0);
    });
  });

  describe('DELETE probands/user_id/queues/instance_id', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/QTestStudieProband1/queues/99996')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if the user_id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/nonexistingUser/queues/99996')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if the instance_id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/QTestStudieProband1/queues/3298789')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if proband tries for other proband', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/QTestStudieProband1/queues/99996')
        .set(probandHeader2)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries ', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/QTestStudieProband1/queues/99996')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and delete correct queue', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/QTestStudieProband1/queues/99996')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.user_id).to.equal('QTestStudieProband1');
      expect(result.body.questionnaire_instance_id).to.equal(99996);

      const result2 = await chai
        .request(apiAddress)
        .get('/probands/QTestStudieProband1/queues')
        .set(probandHeader1);
      expect(result2).to.have.status(StatusCodes.OK);
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
