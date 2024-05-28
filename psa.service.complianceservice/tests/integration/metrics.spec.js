/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const { config } = require('../../src/config');
const { Server } = require('../../src/server');
const apiAddress = `http://localhost:${config.public.port}`;

describe('/metrics', () => {
  before(async () => {
    await Server.init();
  });

  after(async () => {
    await Server.stop();
  });

  describe('GET /metrics', async () => {
    it('should return http 200 with a string', async () => {
      const result = await chai.request(apiAddress).get('/metrics');
      expect(result).to.have.status(200);
      expect(result.text).to.be.an('string');
    });
  });
});
