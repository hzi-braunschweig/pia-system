/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import chaiHttp from 'chai-http';
import * as sinon from 'sinon';

import { Server } from '../../src/server';
import { config } from '../../src/config';
import { TaskScheduler } from '../../src/services/taskScheduler';
import { StatusCodes } from 'http-status-codes';

const expect = chai.expect;
chai.use(chaiHttp);

const suiteSandbox = sinon.createSandbox();

const apiAddress = `http://localhost:${config.public.port}`;

describe('/metrics', () => {
  before(async function () {
    suiteSandbox.stub(TaskScheduler, 'init');
    suiteSandbox.stub(TaskScheduler, 'stop');
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    suiteSandbox.restore();
  });

  describe('GET /metrics', () => {
    it('should return http 200 with a string', async () => {
      const result = await chai.request(apiAddress).get('/metrics');
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.text).to.be.an('string');
    });
  });
});
