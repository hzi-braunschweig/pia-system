/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const { setup, cleanup } = require('./users.spec.data/setup.helper');

const server = require('../../src/server');

const apiAddress = 'http://localhost:' + process.env.INTERNAL_PORT + '/user';

describe('/professional', function () {
  before(async function () {
    await setup();
    await server.init();
  });

  after(async function () {
    await server.stop();
    await cleanup();
  });

  describe('GET /professional/{username}/allProbands', function () {
    it('should return HTTP 200 with empty result if no access was granted', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/professional/researcher5@example.com/allProbands');
      expect(result).to.have.status(200);
      expect(result.body).to.be.empty;
    });

    it('should return HTTP 200 with pseudonyms the PM has access to', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/professional/pm1@example.com/allProbands');
      expect(result).to.have.status(200);
      expect(result.body).to.have.lengthOf(3);
      expect(result.body).to.contain('QTestProband1');
      expect(result.body).to.contain('QTestProband4');
    });

    it('should return HTTP 200 with pseudonyms the Forscher has access to', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/professional/researcher1@example.com/allProbands');
      expect(result).to.have.status(200);
      expect(result.body).to.have.lengthOf(5);
      expect(result.body).to.contain('QTestProband1');
      expect(result.body).to.contain('QTestProband2');
      expect(result.body).to.contain('QTestProband3');
      expect(result.body).to.contain('QTestProband4');
    });
  });
});
