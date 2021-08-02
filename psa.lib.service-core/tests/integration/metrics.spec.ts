/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import chaiHttp from 'chai-http';

import { Server } from '../example-service/server';
import { config } from '../example-service/config';

chai.use(chaiHttp);
const expect = chai.expect;
const HTTP_OK = 200;

const apiAddress = 'http://localhost:' + config.public.port.toString();

describe('/metrics', () => {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('GET /metrics', () => {
    it('should return http 200 with a string', async () => {
      const result = await chai.request(apiAddress).get('/metrics');
      expect(result, result.text).to.have.status(HTTP_OK);
      expect(result.text).to.be.an('string');
    });
  });
});
