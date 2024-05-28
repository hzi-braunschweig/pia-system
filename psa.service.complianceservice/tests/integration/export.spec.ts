/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';
import sinon from 'sinon';
import fetchMocker from 'fetch-mock';

import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { Server } from '../../src/server';
import { config } from '../../src/config';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const studyName = 'ExportTestStudie';
const exportUrl = `/admin/${studyName}/agree/export`;

const forscherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-exportforscher',
  studies: [studyName],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin',
  studies: [],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam',
  studies: [studyName],
});
const ewHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['EinwilligungsManager'],
  username: 'qtest-einwilligungsmanager',
  studies: [studyName],
});
const ewHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['EinwilligungsManager'],
  username: 'qtest-einwilligungsmanager',
  studies: ['OtherStudie'],
});
const probandHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband',
  studies: [studyName],
});

const sandbox = sinon.createSandbox();
const fetchMock = fetchMocker.sandbox();

describe('/admin/{studyName}/agree/export', function () {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    sandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);

    AuthServerMock.adminRealm().returnValid();
  });

  afterEach(() => {
    sandbox.restore();
    fetchMock.restore();

    AuthServerMock.cleanAll();
  });

  describe('POST /admin/{studyName}/agree/export', function () {
    it('should return HTTP 403 if a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post(exportUrl)
        .set(probandHeader)
        .send();
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post(exportUrl)
        .set(sysadminHeader)
        .send();
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post(exportUrl)
        .set(utHeader)
        .send();
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post(exportUrl)
        .set(forscherHeader)
        .send();
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a EW without study access tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post(exportUrl)
        .set(ewHeader2)
        .send();
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with correct data if a EW with study access tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post(exportUrl)
        .set(ewHeader1)
        .send();
      expect(result).to.have.status(StatusCodes.OK);
    });
  });
});
