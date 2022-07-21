/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';

import { Response } from '@pia/lib-service-core';
import { Server } from '../../src/server';
import {
  cleanup,
  setup,
} from './internal-getExternalIds.spec.data/setup.helper';
import { config } from '../../src/config';
import { StatusCodes } from 'http-status-codes';
import { ProbandExternalIdResponse } from '../../src/models/proband';

chai.use(chaiHttp);

const internalApiAddress = `http://localhost:${config.internal.port}`;

describe('Internal: getExternalIds', () => {
  before(async function () {
    await setup();
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    await cleanup();
  });

  describe('GET /user/externalId', () => {
    it('should return HTTP 400 if no study was specified', async function () {
      const result: Response<ProbandExternalIdResponse> = await chai
        .request(internalApiAddress)
        .get('/user/externalId');
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 200 with non null external IDs if filtered by study', async function () {
      const query = new URLSearchParams();
      query.append('study', 'ApiTestStudie1');
      query.append('complianceContact', 'true');
      const result: Response<ProbandExternalIdResponse> = await chai
        .request(internalApiAddress)
        .get('/user/externalId?' + query.toString());
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(2);
      expect(result.body).to.deep.include({
        pseudonym: 'qtest-api-proband1',
        externalId: 'QTest-API-Proband1',
      });
      expect(result.body).to.deep.include({
        pseudonym: 'qtest-api-proband4',
        externalId: 'QTest-API-Proband4',
      });
    });

    it('should return HTTP 200 with non null external IDs if filtered by study and complianceContact = true', async function () {
      const query = new URLSearchParams();
      query.append('study', 'ApiTestStudie2');
      query.append('complianceContact', 'true');
      const result: Response<ProbandExternalIdResponse> = await chai
        .request(internalApiAddress)
        .get('/user/externalId?' + query.toString());
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(1);
      expect(result.body).to.deep.include({
        pseudonym: 'qtest-api-proband3',
        externalId: 'QTest-API-Proband3',
      });
    });

    it('should return HTTP 200 with non null external IDs if filtered by study and complianceContact = false', async function () {
      const query = new URLSearchParams();
      query.append('study', 'ApiTestStudie2');
      query.append('complianceContact', 'false');
      const result: Response<ProbandExternalIdResponse> = await chai
        .request(internalApiAddress)
        .get('/user/externalId?' + query.toString());
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(1);
      expect(result.body).to.deep.include({
        pseudonym: 'qtest-api-proband2',
        externalId: 'QTest-API-Proband2',
      });
    });
  });
});
