/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import chaiHttp from 'chai-http';

import { Server } from '../example-service/server';
import { config } from '../example-service/config';
import { StatusCodes } from 'http-status-codes';

chai.use(chaiHttp);
const expect = chai.expect;

const apiAddress = `http://localhost:${config.public.port}`;

describe('/health', () => {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('GET /health', () => {
    it('should return http 200 when health check succeeded', async () => {
      const result = await chai.request(apiAddress).get('/health');
      expect(result).to.have.status(StatusCodes.OK);
    });

    it('should return http 503 when health check failed', async () => {
      Server.healthCheckResult = false;

      const result = await chai.request(apiAddress).get('/health');
      expect(result).to.have.status(StatusCodes.SERVICE_UNAVAILABLE);
    });
  });
});
