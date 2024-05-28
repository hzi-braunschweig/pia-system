/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';

import { cleanup, setup } from '../admin/users.spec.data/setup.helper';
import { Server } from '../../../src/server';
import { config } from '../../../src/config';

chai.use(chaiHttp);

const internalApiAddress = `http://localhost:${config.internal.port}`;

describe('Internal: /professional', function () {
  before(async function () {
    await setup();
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    await cleanup();
  });

  describe('GET /user/professional/{username}/allProbands', function () {
    it('should return HTTP 200 with empty result if no access was granted', async function () {
      // Arrange

      // Act
      const result = await chai
        .request(internalApiAddress)
        .get('/user/professional/researcher5@example.com/allProbands');

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.empty;
    });

    it('should return HTTP 200 with pseudonyms the PM has access to', async function () {
      // Arrange

      // Act
      const result = await chai
        .request(internalApiAddress)
        .get('/user/professional/pm1@example.com/allProbands');

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      const expectedNumberOfFoundProbands = 4;
      expect(result.body).to.have.lengthOf(expectedNumberOfFoundProbands);
      expect(result.body).to.contain('qtest-proband1');
      expect(result.body).to.contain('qtest-proband4');
    });

    it('should return HTTP 200 with pseudonyms the Forscher has access to', async function () {
      // Arrange

      // Act
      const result = await chai
        .request(internalApiAddress)
        .get('/user/professional/researcher1@example.com/allProbands');

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      const expectedNumberOfFoundProbands = 6;
      expect(result.body).to.have.lengthOf(expectedNumberOfFoundProbands);
      expect(result.body).to.contain('qtest-proband1');
      expect(result.body).to.contain('qtest-proband2');
      expect(result.body).to.contain('qtest-proband3');
      expect(result.body).to.contain('qtest-proband4');
    });
  });
});
