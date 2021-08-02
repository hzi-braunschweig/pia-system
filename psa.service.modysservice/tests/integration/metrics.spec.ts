/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import chaiHttp from 'chai-http';
import * as sinon from 'sinon';

import { Server } from '../../src/server';
import { TaskScheduler } from '../../src/services/taskScheduler';

const expect = chai.expect;
chai.use(chaiHttp);

const serverSandbox = sinon.createSandbox();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const apiAddress = `http://localhost:${process.env['PORT']!}`;

describe('/metrics', () => {
  before(async function () {
    serverSandbox.stub(TaskScheduler, 'init');
    serverSandbox.stub(TaskScheduler, 'stop');
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
