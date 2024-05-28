/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Server } from '../../../src/server';
import { db } from '../../../src/db';
import { config } from '../../../src/config';
import { Response } from '@pia/lib-service-core';
import { ProbandInternalDto } from '@pia-system/lib-http-clients-internal';
import { StatusCodes } from 'http-status-codes';
import { mockGetProbandAccount } from '../accountServiceRequestMock.helper.spec';
import * as sinon from 'sinon';

chai.use(chaiHttp);

const internalApiAddress = `http://localhost:${config.internal.port}`;

const testSandbox = sinon.createSandbox();

describe('Internal: get proband', () => {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  afterEach(() => testSandbox.restore());

  describe('GET /user/users/{pseudonym}', () => {
    before(async () => {
      await db.none("INSERT INTO studies (name) VALUES ('QTestStudy1')");
      await db.none(
        "INSERT INTO probands (pseudonym, study, origin) VALUES ('qtest-proband1', 'QTestStudy1', 'investigator');"
      );
    });

    after(async () => {
      await db.none("DELETE FROM probands WHERE pseudonym = 'qtest-proband1'");
      await db.none("DELETE FROM studies WHERE name = 'QTestStudy1'");
    });

    it('should return HTTP 200 with proband', async function () {
      // Arrange
      const username = 'qtest-proband1';
      mockGetProbandAccount(testSandbox, username, 'QTestStudy1');

      // Act
      const result: Response<ProbandInternalDto> = await chai
        .request(internalApiAddress)
        .get(`/user/users/${username}`);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband1');
      expect(result.body.status).to.equal('active');
      expect(result.body.accountStatus).to.equal('account');
    });

    it('should return HTTP 404 if proband does not exist', async function () {
      // Arrange
      const username = 'qtest-proband999';

      // Act
      const result = await chai
        .request(internalApiAddress)
        .get(`/user/users/${username}`);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });
  });

  describe('GET /user/users/ids/{ids}', () => {
    before(async () => {
      await db.none("INSERT INTO studies (name) VALUES ('QTestStudy1')");
      await db.none(
        "INSERT INTO probands (pseudonym, ids, study, origin) VALUES ('qtest-proband2', 'ids-1234', 'QTestStudy1', 'investigator');"
      );
    });

    after(async () => {
      await db.none("DELETE FROM probands WHERE pseudonym = 'qtest-proband2'");
      await db.none("DELETE FROM studies WHERE name = 'QTestStudy1'");
    });

    it('should return HTTP 200 with proband', async function () {
      // Arrange
      const ids = 'ids-1234';
      mockGetProbandAccount(testSandbox, 'qtest-proband2', 'QTestStudy1');

      // Act
      const result: Response<ProbandInternalDto> = await chai
        .request(internalApiAddress)
        .get(`/user/users/ids/${ids}`);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('qtest-proband2');
      expect(result.body.status).to.equal('active');
      expect(result.body.accountStatus).to.equal('account');
      expect(result.body.ids).to.equal('ids-1234');
    });

    it('should return HTTP 404 if proband does not exist', async function () {
      // Arrange
      const ids = 'unknown-ids';

      // Act
      const result = await chai
        .request(internalApiAddress)
        .get(`/user/users/ids/${ids}`);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });
  });
});
