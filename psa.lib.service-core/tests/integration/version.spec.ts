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

describe('/example/version', () => {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('GET /version', () => {
    it('should return http 200 with version information', async () => {
      const result = await chai.request(apiAddress).get('/version');
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body).to.eql({
        PIPELINE_ID: '17479',
        GIT_HASH: 'fbf64670',
        GIT_REF: '1.18.0',
      });
    });
  });
});
