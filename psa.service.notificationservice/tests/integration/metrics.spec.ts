/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import sinon from 'sinon';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { ListeningDbClient } from '@pia/lib-service-core';
import { FcmHelper } from '../../src/services/fcmHelper';
import { Server } from '../../src/server';
import StatusCodes from 'http-status-codes';
import { config } from '../../src/config';

chai.use(chaiHttp);

describe('/metrics', () => {
  const apiAddress = `http://localhost:${config.public.port}`;

  const suiteSandbox = sinon.createSandbox();

  before(async function () {
    suiteSandbox.stub(ListeningDbClient.prototype);
    suiteSandbox.stub(FcmHelper, 'sendDefaultNotification');
    suiteSandbox.stub(FcmHelper, 'initFBAdmin');
    await Server.init();
  });

  after(async function () {
    suiteSandbox.restore();
    await Server.stop();
  });

  describe('GET /metrics', () => {
    it('should return http 200 with a string', async () => {
      const result = await chai.request(apiAddress).get('/metrics');
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.text).to.be.an('string');
    });
  });
});
