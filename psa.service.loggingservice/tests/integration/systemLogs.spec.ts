/* eslint-disable @typescript-eslint/no-magic-numbers */
/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';

import { Server } from '../../src/server';
import { config } from '../../src/config';
import { Response } from './instance.helper.spec';
import { cleanup, setup } from './systemLogs.spec.data/setup.helper';
import { SystemLogRes } from '../../src/model/systemLog';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: [],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: [],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam',
  studies: [],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: [],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin',
  studies: [],
});

describe('/admin/systemLogs', () => {
  before(async () => {
    await Server.init();
  });

  after(async () => {
    await Server.stop();
  });

  describe('GET /admin/systemLogs', () => {
    const queryValidAll = `/admin/systemLogs?types=sample&types=proband&types=partial&types=study&fromTime=1970-01-01&toTime=3000-01-01`;
    const queryValidEmptyFrom = `/admin/systemLogs?types=sample&types=proband&types=partial&types=study&toTime=3000-01-01`;
    const queryValidEmptyTo = `/admin/systemLogs?types=sample&types=proband&types=partial&types=study&fromTime=1970-01-01`;
    const queryValidShortTime = `/admin/systemLogs?types=sample&types=proband&types=partial&types=study&fromTime=2001-01-01&toTime=2001-01-02`;
    const queryValidStudies = `/admin/systemLogs?types=study&fromTime=1970-01-01&toTime=3000-01-01`;
    const queryValidCompliances = `/admin/systemLogs?types=compliance&fromTime=1970-01-01&toTime=3000-01-01`;
    const queryValidProbands = `/admin/systemLogs?types=proband&fromTime=1970-01-01&toTime=3000-01-01`;
    const queryValidSamples = `/admin/systemLogs?types=sample&fromTime=1970-01-01&toTime=3000-01-01`;
    const queryValidPartials = `/admin/systemLogs?types=partial&fromTime=1970-01-01&toTime=3000-01-01`;
    const queryWrongDate = `/admin/systemLogs?types=sample&types=proband&types=partial&types=study&fromTime=1970-01-01&toTime=surelyNotADate`;
    const queryNoTypes = `/admin/systemLogs?fromTime=1970-01-01&toTime=3000-01-01`;
    const queryWrongType = `/admin/systemLogs?types=wrongType&types=proband&types=partial&types=study&fromTime=1970-01-01&toTime=3000-01-01`;

    before(async () => {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    describe('with invalid token', () => {
      it('should return 401 if the token is invalid', async () => {
        const authRequest = AuthServerMock.adminRealm().returnInvalid();
        const result = await chai
          .request(apiAddress)
          .get(queryValidAll)
          .set(sysadminHeader);
        expect(authRequest.isDone()).to.be.true;
        expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
      });
    });

    describe('with valid token', () => {
      beforeEach(() => AuthServerMock.adminRealm().returnValid());
      afterEach(AuthServerMock.cleanAll);

      it('should return 403 if PM tries', async () => {
        const result = await chai
          .request(apiAddress)
          .get(queryValidAll)
          .set(pmHeader);
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return http 403 if a UT tries', async () => {
        const result = await chai
          .request(apiAddress)
          .get(queryValidAll)
          .set(utHeader);
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return http 403 if a forscher tries', async () => {
        const result = await chai
          .request(apiAddress)
          .get(queryValidAll)
          .set(forscherHeader1);
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return http 403 if proband tries', async () => {
        const result = await chai
          .request(apiAddress)
          .get(queryValidAll)
          .set(probandHeader1);
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return http 400 if a type is invalid', async () => {
        const result = await chai
          .request(apiAddress)
          .get(queryWrongType)
          .set(sysadminHeader);
        expect(result).to.have.status(StatusCodes.BAD_REQUEST);
      });

      it('should return http 200 with empty array if no type is specified', async () => {
        const result = await chai
          .request(apiAddress)
          .get(queryNoTypes)
          .set(sysadminHeader);
        expect(result).to.have.status(StatusCodes.BAD_REQUEST);
      });

      it('should return http 200 with empty array if a date is invalid', async () => {
        const result = await chai
          .request(apiAddress)
          .get(queryWrongDate)
          .set(sysadminHeader);
        expect(result).to.have.status(StatusCodes.BAD_REQUEST);
      });

      it('should return http 200 with all logs', async () => {
        const result: Response<SystemLogRes[]> = await chai
          .request(apiAddress)
          .get(queryValidAll)
          .set(sysadminHeader);
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.length).to.equal(20);
      });

      it('should return http 200 with all logs if fromTime is empty', async () => {
        const result: Response<SystemLogRes[]> = await chai
          .request(apiAddress)
          .get(queryValidEmptyFrom)
          .set(sysadminHeader);
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.length).to.equal(20);
      });

      it('should return http 200 with all logs if toTime is empty', async () => {
        const result: Response<SystemLogRes[]> = await chai
          .request(apiAddress)
          .get(queryValidEmptyTo)
          .set(sysadminHeader);
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.length).to.equal(20);
      });

      it('should return http 200 with all partial logs', async () => {
        const result: Response<SystemLogRes[]> = await chai
          .request(apiAddress)
          .get(queryValidPartials)
          .set(sysadminHeader);
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.length).to.equal(5);
        expect(result.body[0]?.type).to.equal('partial');
        expect(result.body[1]?.type).to.equal('partial');
        expect(result.body[2]?.type).to.equal('partial');
        expect(result.body[3]?.type).to.equal('partial');
        expect(result.body[4]?.type).to.equal('partial');
      });

      it('should return http 200 with all probands logs', async () => {
        const result: Response<SystemLogRes[]> = await chai
          .request(apiAddress)
          .get(queryValidProbands)
          .set(sysadminHeader);
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.length).to.equal(5);
        expect(result.body[0]?.type).to.equal('proband');
        expect(result.body[1]?.type).to.equal('proband');
        expect(result.body[2]?.type).to.equal('proband');
        expect(result.body[3]?.type).to.equal('proband');
        expect(result.body[4]?.type).to.equal('proband');
      });

      it('should return http 200 with all samples logs', async () => {
        const result: Response<SystemLogRes[]> = await chai
          .request(apiAddress)
          .get(queryValidSamples)
          .set(sysadminHeader);
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.length).to.equal(5);
        expect(result.body[0]?.type).to.equal('sample');
        expect(result.body[1]?.type).to.equal('sample');
        expect(result.body[2]?.type).to.equal('sample');
        expect(result.body[3]?.type).to.equal('sample');
        expect(result.body[4]?.type).to.equal('sample');
      });

      it('should return http 200 with all studies logs', async () => {
        const result: Response<SystemLogRes[]> = await chai
          .request(apiAddress)
          .get(queryValidStudies)
          .set(sysadminHeader);
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.length).to.equal(5);
        expect(result.body[0]?.type).to.equal('study');
        expect(result.body[1]?.type).to.equal('study');
        expect(result.body[2]?.type).to.equal('study');
        expect(result.body[3]?.type).to.equal('study');
        expect(result.body[4]?.type).to.equal('study');
      });

      it('should return http 200 with all compliance logs', async () => {
        const result: Response<SystemLogRes[]> = await chai
          .request(apiAddress)
          .get(queryValidCompliances)
          .set(sysadminHeader);
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.length).to.equal(5);
        expect(result.body[0]?.type).to.equal('compliance');
        expect(result.body[1]?.type).to.equal('compliance');
        expect(result.body[2]?.type).to.equal('compliance');
        expect(result.body[3]?.type).to.equal('compliance');
        expect(result.body[4]?.type).to.equal('compliance');
      });

      it('should return http 200 with logs from certain timeframe', async () => {
        const result: Response<SystemLogRes[]> = await chai
          .request(apiAddress)
          .get(queryValidShortTime)
          .set(sysadminHeader);
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.length).to.equal(8);
      });
    });
  });
});
