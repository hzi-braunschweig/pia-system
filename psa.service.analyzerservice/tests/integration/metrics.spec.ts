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
import { ListeningDbClient } from '@pia/lib-service-core';

const expect = chai.expect;
chai.use(chaiHttp);

const serverSandbox = sinon.createSandbox();

const apiAddress = `http://localhost:${config.public.port}`;

describe('/metrics', () => {
  before(async function () {
    serverSandbox.stub(TaskScheduler, 'init');
    serverSandbox.stub(TaskScheduler, 'stop');
    serverSandbox.stub(ListeningDbClient.prototype);
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    serverSandbox.restore();
  });

  describe('GET /metrics', () => {
    it('should return http 200 with a string', async () => {
      const expectedStatus = 200;
      const result = await chai.request(apiAddress).get('/metrics');
      expect(result).to.have.status(expectedStatus);
      expect(result.text).to.be.an('string');
    });
  });
});
