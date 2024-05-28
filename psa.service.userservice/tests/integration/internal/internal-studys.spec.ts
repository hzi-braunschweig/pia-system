/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { db } from '../../../src/db';
import { Server } from '../../../src/server';
import { config } from '../../../src/config';
import { StatusCodes } from 'http-status-codes';
import { Study } from '../../../src/models/study';

chai.use(chaiHttp);
const internalApiAddress = `http://localhost:${config.internal.port}`;

describe('Internal: studies', () => {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('GET /user/studies/{studyName}', () => {
    before(async () => {
      await db.none("INSERT INTO studies (name) VALUES ('TestStudy')");
    });

    after(async () => {
      await db.none("DELETE FROM studies WHERE name = 'TestStudy'");
    });

    it('should return 404 if study does not exist', async function () {
      const result: { body: Study } = await chai
        .request(internalApiAddress)
        .get('/user/studies/NoStudy');
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return the queried study', async function () {
      const result: { body: Study } = await chai
        .request(internalApiAddress)
        .get('/user/studies/TestStudy');
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.name).to.equal('TestStudy');
    });
  });
});
