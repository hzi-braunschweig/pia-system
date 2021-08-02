/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;

const { db } = require('../../src/db');
const { cleanupFile } = require('./systemLogs.spec.data/sqlFiles');

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.INTERNAL_PORT + '/log';

describe('Internal: /log/systemLogs', () => {
  before(async () => {
    await server.init();
  });

  after(async () => {
    await server.stop();
  });

  describe('POST /log/systemLogs', async () => {
    before(async () => {
      await db.none(cleanupFile);
    });

    after(async function () {
      await db.none(cleanupFile);
    });

    it('should return http 200 with empty array if no type is specified', async () => {
      const before = new Date(Date.now() - 1);
      const result = await chai.request(apiAddress).post('/systemLogs').send({
        requestedBy: 'QTestSystemAdmin1',
        requestedFor: 'QTestSystemAdmin2',
        type: 'study_change',
      });
      expect(result).to.have.status(200);
      expect(result.body).to.be.not.null;
      expect(result.body.requestedBy).to.equal('QTestSystemAdmin1');
      expect(result.body.requestedFor).to.equal('QTestSystemAdmin2');
      expect(result.body.type).to.equal('study_change');
      expect(new Date(result.body.timestamp)).to.be.greaterThan(before);
    });
  });
});
