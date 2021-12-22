/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Server } from '../../src/server';
import { cleanup, setup } from './internal-pseudonyms.spec.data/setup.helper';
import { config } from '../../src/config';
import { StatusCodes } from 'http-status-codes';

chai.use(chaiHttp);

const internalApiAddress = `http://localhost:${config.internal.port}`;

describe('Internal: pseudonyms', () => {
  before(async function () {
    await setup();
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    await cleanup();
  });

  describe('GET /user/pseudonyms', () => {
    it('should return HTTP 200 with all pseudonyms if no filter', async function () {
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms');
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(4);
      expect(result.body).to.include('ApiTestProband1');
      expect(result.body).to.include('ApiTestProband2');
      expect(result.body).to.include('ApiTestProband3');
      expect(result.body).to.include('ApiTestProband4');
    });

    it('should return HTTP 200 with some pseudonyms if filtered by study', async function () {
      const query = new URLSearchParams();
      query.append('study', 'ApiTestStudie1');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query.toString());
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(2);
      expect(result.body).to.include('ApiTestProband1');
      expect(result.body).to.include('ApiTestProband4');
    });

    it('should return HTTP 200 with some pseudonyms if filtered by status active', async function () {
      const query = new URLSearchParams();
      query.append('status', 'active');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query.toString());
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(3);
      expect(result.body).to.include('ApiTestProband1');
      expect(result.body).to.include('ApiTestProband3');
      expect(result.body).to.include('ApiTestProband4');
    });

    it('should return HTTP 200 with some pseudonyms if filtered by status deactivated', async function () {
      const query = new URLSearchParams();
      query.append('status', 'deactivated');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query.toString());
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(1);
      expect(result.body).to.include('ApiTestProband2');
    });

    it('should return HTTP 200 with some pseudonyms if filtered by status active and deleted', async function () {
      const query = new URLSearchParams();
      query.append('status', 'active');
      query.append('status', 'deleted');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query.toString());
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(3);
      expect(result.body).to.include('ApiTestProband1');
      expect(result.body).to.include('ApiTestProband3');
      expect(result.body).to.include('ApiTestProband4');
    });

    it('should return HTTP 200 with some pseudonyms if filtered by study and status active', async function () {
      const query = new URLSearchParams();
      query.append('study', 'ApiTestStudie1');
      query.append('status', 'active');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query.toString());
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(2);
      expect(result.body).to.include('ApiTestProband1');
      expect(result.body).to.include('ApiTestProband4');
    });

    it('should return HTTP 200 with no pseudonyms if filter by study and status is too strict', async function () {
      const query = new URLSearchParams();
      query.append('study', 'ApiTestStudie1');
      query.append('status', 'deactivated');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query.toString());
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(0);
    });

    it('should return HTTP 200 with some pseudonyms if filtered by study and complianceContact = true', async function () {
      const query = new URLSearchParams();
      query.append('study', 'ApiTestStudie1');
      query.append('complianceContact', 'true');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query.toString());
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(2);
      expect(result.body).to.include('ApiTestProband1');
      expect(result.body).to.include('ApiTestProband4');
    });

    it('should return HTTP 200 with some pseudonyms if filtered by study and complianceContact = false', async function () {
      const query = new URLSearchParams();
      query.append('study', 'ApiTestStudie2');
      query.append('complianceContact', 'false');
      const result = await chai
        .request(internalApiAddress)
        .get('/user/pseudonyms?' + query.toString());
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.length(1);
      expect(result.body).to.include('ApiTestProband2');
    });
  });
});
