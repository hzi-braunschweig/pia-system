/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';

import { Response } from './instance.helper.spec';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { cleanup, setup } from './systemLogs.spec.data/setup.helper';
import { SystemLogRes } from '../../src/model/systemLog';

chai.use(chaiHttp);

const internalApiAddress = `http://localhost:${config.internal.port}/log`;

describe('Internal: /log/systemLogs', () => {
  before(async () => {
    await Server.init();
  });

  after(async () => {
    await Server.stop();
  });

  describe('POST /log/systemLogs', () => {
    before(async () => {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return http 200 with empty array if no type is specified', async () => {
      const before = new Date(Date.now() - 1);
      const result: Response<SystemLogRes> = await chai
        .request(internalApiAddress)
        .post('/systemLogs')
        .send({
          requestedBy: 'qtest-sysadmin1',
          requestedFor: 'qtest-sysadmin2',
          type: 'study_change',
        });
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.not.null;
      expect(result.body.requestedBy).to.equal('qtest-sysadmin1');
      expect(result.body.requestedFor).to.equal('qtest-sysadmin2');
      expect(result.body.type).to.equal('study_change');
      expect(new Date(result.body.timestamp)).to.be.greaterThan(before);
    });
  });
});
