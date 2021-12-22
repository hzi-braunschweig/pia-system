/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import StatusCodes from 'http-status-codes';
import { Server } from '../../src/server';
import { config } from '../../src/config';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

describe('/metrics', () => {
  before(async () => {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('GET /metrics', () => {
    it('should return http 200 with a string', async () => {
      const result = await chai.request(apiAddress).get('/metrics');
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.text).to.be.an('string');
    });
  });
});
