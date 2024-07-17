/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import fetchMocker from 'fetch-mock';
import { Response } from '@pia/lib-service-core';
import { config } from '../../src/config';
import { Server } from '../../src/server';
import { cleanup, setup } from './pendingDeletions.spec.data/setup.helper';
import { StatusCodes } from 'http-status-codes';
import { PendingDeletionDb } from '../../src/models/pendingDeletion';

chai.use(chaiHttp);
const apiAddress = `http://localhost:${config.internal.port}/personal`;

describe('Internal: /studies/{studyName}/pendingdeletions', function () {
  const fetchMock = fetchMocker.sandbox();
  const serverSandbox = sinon.createSandbox();
  const testSandbox = sinon.createSandbox();

  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    serverSandbox.restore();
  });

  beforeEach(async () => {
    await setup();
  });

  afterEach(async function () {
    testSandbox.restore();
    fetchMock.restore();
    await cleanup();
  });

  describe('GET /studies/{studyName}/pendingdeletions', function () {
    it('should return HTTP 200 with the pending deletions', async () => {
      const result: Response<PendingDeletionDb[]> = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy1/pendingdeletions');

      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array').and.to.have.lengthOf(2);

      const item0 = result.body[0];
      expect(item0!.requested_by).to.equal('pm1@example.com');
      expect(item0!.requested_for).to.equal('pm2@example.com');
      expect(item0!.proband_id).to.equal('qtest-proband1');
      const item1 = result.body[1];
      expect(item1!.requested_by).to.equal('qtest-pm_no_email');
      expect(item1!.requested_for).to.equal('pm1@example.com');
      expect(item1!.proband_id).to.equal('qtest-proband3');
    });
  });
});
