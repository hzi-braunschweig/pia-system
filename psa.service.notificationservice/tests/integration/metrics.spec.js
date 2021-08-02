/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const sinon = require('sinon');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const { ListeningDbClient } = require('@pia/lib-service-core');
const fcmHelper = require('../../src/services/fcmHelper.js');
const server = require('../../src/server');

const apiAddress = 'http://localhost:' + process.env.PORT;

const serverSandbox = sinon.createSandbox();

describe('/metrics', () => {
  before(async function () {
    serverSandbox.stub(ListeningDbClient.prototype);
    serverSandbox.stub(fcmHelper);
    await server.init();
  });

  after(async function () {
    serverSandbox.restore();
    await server.stop();
  });

  describe('GET /metrics', async () => {
    it('should return http 200 with a string', async () => {
      const result = await chai.request(apiAddress).get('/metrics');
      expect(result, result.text).to.have.status(200);
      expect(result.text).to.be.an('string');
    });
  });
});
