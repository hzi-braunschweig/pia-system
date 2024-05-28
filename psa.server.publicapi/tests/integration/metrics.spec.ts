/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { PublicApiServer } from '../../src/server';
import { config } from '../../src/config';

chai.use(chaiHttp);

describe('/metrics', () => {
  const OK = 200;
  const apiAddress = `http://localhost:${config.public.port}`;
  let server: PublicApiServer;

  before(async () => {
    server = new PublicApiServer();
    await server.init();
  });

  after(async function () {
    await server.stop();
  });

  describe('GET /metrics', () => {
    it('should return http 200 with a string', async () => {
      const result = await chai.request(apiAddress).get('/metrics');
      expect(result).to.have.status(OK);
      expect(result.text).to.be.an('string');
    });
  });
});
