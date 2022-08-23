/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';

import {
  AuthServerMock,
  AuthTokenMockBuilder,
  Response,
} from '@pia/lib-service-core';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { cleanup, setup } from './probandsToContact.spec.data/setup.helper';
import { ProbandToContactDto } from '../../src/models/probandsToContact';
import { mockGetProbandAccountsByStudyName } from './accountServiceRequestMock.helper.spec';
import sinon from 'sinon';
import assert from 'assert';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['ApiTestStudie'],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['ApiTestStudie', 'ApiTestStudie2', 'ApiTestMultiProf'],
});
const utHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'ut@apitest.de',
  studies: ['ApiTestStudie', 'ApiTestMultiProf'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin',
  studies: [],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: ['ApiTestStudie', 'ApiTestMultiProf'],
});

describe('/admin/probandstocontact', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await Server.init();
  });

  after(async () => {
    await Server.stop();
  });

  beforeEach(async () => {
    await setup();
    AuthServerMock.adminRealm().returnValid();
  });

  afterEach(async () => {
    await cleanup();
    AuthServerMock.cleanAll();
    sandbox.restore();
  });

  describe('GET /admin/probandstocontact', () => {
    it('should return HTTP 403 if a Proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probandstocontact')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a UT tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probandstocontact')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probandstocontact')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a SysAdmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probandstocontact')
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with active probands to contact for PM', async () => {
      // Arrange
      const expectedResultLength = 2;
      mockGetProbandAccountsByStudyName(
        sandbox,
        ['ApiTestStudie', 'ApiTestMultiProf'],
        ['qtest-proband1']
      );

      // Act
      const result: Response<ProbandToContactDto[]> = await chai
        .request(apiAddress)
        .get('/admin/probandstocontact')
        .set(pmHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(expectedResultLength);

      assert(result.body[0]);
      expect(result.body[0].id).to.equal(1);
      expect(result.body[0].user_id).to.equal('qtest-proband1');
      expect(result.body[0].accountStatus).to.equal('account');

      assert(result.body[1]);
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      expect(result.body[1].id).to.equal(4);
      expect(result.body[1].user_id).to.equal('qtest-proband4');
      expect(result.body[1].accountStatus).to.equal('no_account');
    });
  });
});
