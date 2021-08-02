/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
chai.use(chaiHttp);

const server = require('../../src/server');

const internalApiAddress = 'http://localhost:' + process.env.INTERNAL_PORT;

const {
  setup,
  cleanup,
} = require('./internal-pseudonyms.spec.data/setup.helper');

describe('Internal: pseudonyms', () => {
  before(async function () {
    await setup();
    await server.init();
  });

  after(async function () {
    await server.stop();
    await cleanup();
  });

  describe('GET /user/pseudonyms', () => {
    it('should return HTTP 200 with all pseudonyms if no filter', async function () {
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms');
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array');
      expect(result.body.length).to.equal(4);
      expect(result.body).to.include('ApiTestProband1');
      expect(result.body).to.include('ApiTestProband2');
      expect(result.body).to.include('ApiTestProband3');
      expect(result.body).to.include('ApiTestProband4');
    });

    it('should return HTTP 200 with some pseudonyms if filtered by study', async function () {
      const query = new URLSearchParams();
      query.append('study', 'ApiTestStudie1');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query);
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array');
      expect(result.body.length).to.equal(2);
      expect(result.body).to.include('ApiTestProband1');
      expect(result.body).to.include('ApiTestProband4');
    });

    it('should return HTTP 200 with some pseudonyms if filtered by account status active', async function () {
      const query = new URLSearchParams();
      query.append('accountStatus', 'active');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query);
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array');
      expect(result.body.length).to.equal(1);
      expect(result.body).to.include('ApiTestProband1');
    });

    it('should return HTTP 200 with some pseudonyms if filtered by account status deactivated', async function () {
      const query = new URLSearchParams();
      query.append('accountStatus', 'deactivated');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query);
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array');
      expect(result.body.length).to.equal(1);
      expect(result.body).to.include('ApiTestProband2');
    });

    it('should return HTTP 200 with some pseudonyms if filtered by account status active and deactivation_pending', async function () {
      const query = new URLSearchParams();
      query.append('accountStatus', 'active');
      query.append('accountStatus', 'deactivation_pending');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query);
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array');
      expect(result.body.length).to.equal(2);
      expect(result.body).to.include('ApiTestProband1');
      expect(result.body).to.include('ApiTestProband3');
    });

    it('should return HTTP 200 with some pseudonyms if filtered by study and account status active and no_account', async function () {
      const query = new URLSearchParams();
      query.append('study', 'ApiTestStudie1');
      query.append('accountStatus', 'active');
      query.append('accountStatus', 'no_account');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query);
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array');
      expect(result.body.length).to.equal(2);
      expect(result.body).to.include('ApiTestProband1');
      expect(result.body).to.include('ApiTestProband4');
    });

    it('should return HTTP 200 with no pseudonyms if filter by study and account status is too strict', async function () {
      const query = new URLSearchParams();
      query.append('study', 'ApiTestStudie1');
      query.append('accountStatus', 'deactivated');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query);
      expect(result).to.have.status(200);
      expect(result.body).to.be.an('array');
      expect(result.body.length).to.equal(0);
    });
  });
});
