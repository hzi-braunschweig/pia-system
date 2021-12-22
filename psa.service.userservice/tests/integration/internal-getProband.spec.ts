/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Server } from '../../src/server';
import { db } from '../../src/db';
import { config } from '../../src/config';
import { Response } from './instance.helper.spec';
import { ProbandInternalDto } from '@pia-system/lib-http-clients-internal';
import { StatusCodes } from 'http-status-codes';

chai.use(chaiHttp);

const internalApiAddress = `http://localhost:${config.internal.port}`;

describe('Internal: get proband', () => {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('GET /user/users/{pseudonym}', () => {
    before(async () => {
      await db.none("INSERT INTO studies (name) VALUES ('QTestStudy1')");
      await db.none(
        "INSERT INTO accounts (username, password, role) VALUES ('QTestProband1','', 'Proband');"
      );
      await db.none(
        "INSERT INTO probands (pseudonym, study) VALUES ('QTestProband1', 'QTestStudy1');"
      );
    });

    after(async () => {
      await db.none("DELETE FROM accounts WHERE username = 'QTestProband1'");
      await db.none("DELETE FROM probands WHERE pseudonym = 'QTestProband1'");
      await db.none("DELETE FROM studies WHERE name = 'QTestStudy1'");
    });

    it('should return HTTP 200 with proband', async function () {
      // Arrange
      const username = 'QTestProband1';

      // Act
      const result: Response<ProbandInternalDto> = await chai
        .request(internalApiAddress)
        .get(`/user/users/${username}`);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('QTestProband1');
      expect(result.body.status).to.equal('active');
      expect(result.body.accountStatus).to.equal('account');
    });

    it('should return HTTP 404 if proband does not exist', async function () {
      // Arrange
      const username = 'QTestProband999';

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
        "INSERT INTO accounts (username, password, role) VALUES ('QTestProband2','', 'Proband');"
      );
      await db.none(
        "INSERT INTO probands (pseudonym, ids, study) VALUES ('QTestProband2', 'ids-1234', 'QTestStudy1');"
      );
    });

    after(async () => {
      await db.none("DELETE FROM accounts WHERE username = 'QTestProband2'");
      await db.none("DELETE FROM probands WHERE pseudonym = 'QTestProband2'");
      await db.none("DELETE FROM studies WHERE name = 'QTestStudy1'");
    });

    it('should return HTTP 200 with proband', async function () {
      // Arrange
      const ids = 'ids-1234';

      // Act
      const result: Response<ProbandInternalDto> = await chai
        .request(internalApiAddress)
        .get(`/user/users/ids/${ids}`);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.pseudonym).to.equal('QTestProband2');
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
