/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Server } from '../example-service/server';
import chai, { expect } from 'chai';
import { config } from '../example-service/config';
import { StatusCodes } from 'http-status-codes';

const apiAddress = `http://localhost:${config.public.port}`;

describe('error handler', () => {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('GET /example/boom', () => {
    it('should return http 428 with a string', async () => {
      const result = await chai.request(apiAddress).get('/example/boom');
      expect(result, result.text).to.have.status(
        StatusCodes.PRECONDITION_REQUIRED
      );
    });
  });

  describe('GET /example/causedByError', () => {
    it('should return http 500 with a string', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/example/causedByError');
      expect(result, result.text).to.have.status(
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    });
  });

  describe('GET /example/error', () => {
    it('should return http 500 with a string', async () => {
      const result = await chai.request(apiAddress).get('/example/error');
      expect(result, result.text).to.have.status(
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    });
  });

  describe('GET /example/specificError', () => {
    it('should return http 409 with a string', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/example/specificError');
      expect(result, result.text).to.have.status(StatusCodes.CONFLICT);
    });
  });
});
