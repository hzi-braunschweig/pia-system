/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';

import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { cleanup, setup } from './queues.spec.data/setup.helper';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-studie-proband1',
  studies: [],
});
const probandHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-studi2-proband',
  studies: [],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: [],
});

describe('/probands/{pseudonym}/queues', function () {
  before(async () => {
    await Server.init();
  });

  after(async () => {
    await Server.stop();
  });

  beforeEach(async () => {
    await setup();
    AuthServerMock.probandRealm().returnValid();
  });

  afterEach(async () => {
    await cleanup();
    AuthServerMock.cleanAll;
  });

  describe('GET /probands/{pseudonym}/queues', function () {
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
        .get('/probands/qtest-studie-proband1/queues')
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries ', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/qtest-studie-proband1/queues')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with the correct queues in correct order if the correct Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/probands/qtest-studie-proband1/queues')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.queues.length).to.equal(4);
      expect(result.body.queues[0].user_id).to.equal('qtest-studie-proband1');
      expect(result.body.queues[0].questionnaire_instance_id).to.not.equal(
        undefined
      );
      expect(result.body.queues[0].date_of_queue).to.not.equal(undefined);
      expect(result.body.queues[0].user_id).to.equal('qtest-studie-proband1');
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
        .get('/probands/qtest-studi2-proband/queues')
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.queues.length).to.equal(0);
    });
  });

  describe('DELETE /probands/{pseudonym}/queues/{instanceId}', function () {
    it('should return HTTP 403 if the user_id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/nonexistingUser/queues/99996')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if the instance_id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/qtest-studie-proband1/queues/3298789')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 403 if proband tries for other proband', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/qtest-studie-proband1/queues/99996')
        .set(probandHeader2)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries ', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/qtest-studie-proband1/queues/99996')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 204 and delete correct queue', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/qtest-studie-proband1/queues/99996')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.NO_CONTENT);

      AuthServerMock.probandRealm().returnValid();

      const result2 = await chai
        .request(apiAddress)
        .get('/probands/qtest-studie-proband1/queues')
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

    it('should also accept pseudonyms in uppercase and return HTTP 204', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/probands/QTest-Studie-Proband1/queues/99996')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
    });
  });
});
