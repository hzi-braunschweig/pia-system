/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import fetchMocker from 'fetch-mock';
import { Server } from '../../src/server';
import { StatusCodes } from 'http-status-codes';
import { cleanup, setup } from './accounts.spec.data/setup.helper';
import { config } from '../../src/config';
import {
  AuthServerMock,
  AuthTokenMockBuilder,
  Response,
} from '@pia/lib-service-core';
import { ProfessionalAccount } from '../../src/models/account';
import {
  mockGetProfessionalAccountsByRole,
  mockGetProfessionalAccountsByStudyName,
} from './accountServiceRequestMock.helper.spec';

chai.use(chaiHttp);
chai.use(sinonChai);

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTestStudy1'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin1',
  studies: [],
});
const forscherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'forscher1@example.com',
  studies: ['TestStudy'],
});
const forscherOfAnotherStudyHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'forscher3@example.com',
  studies: ['AnotherStudy'],
});

describe('/admin/accounts', function () {
  const testSandbox = sinon.createSandbox();
  const suiteSandbox = sinon.createSandbox();
  const fetchMock = fetchMocker.sandbox();

  before(async () => {
    await Server.init();
  });

  after(async () => {
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(async () => {
    await setup();
    AuthServerMock.adminRealm().returnValid();
  });

  afterEach(async () => {
    AuthServerMock.cleanAll();
    testSandbox.restore();
    fetchMock.restore();
    await cleanup();
  });

  describe('GET /admin/accounts', function () {
    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/accounts')
        .set(probandHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries without study name', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/accounts')
        .set(forscherHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries with study he/she has no access to', async function () {
      // Arrange
      mockGetProfessionalAccountsByStudyName(testSandbox);
      const query = new URLSearchParams();
      query.append('studyName', 'TestStudy');

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/accounts?' + query.toString())
        .set(forscherOfAnotherStudyHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with all accounts for SysAdmin', async function () {
      // Arrange
      mockGetProfessionalAccountsByRole(testSandbox);
      const expectedResultCount = 9;

      // Act
      const result: Response<ProfessionalAccount[]> = await chai
        .request(apiAddress)
        .get('/admin/accounts')
        .set(sysadminHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(expectedResultCount);
      expect(result.body).to.deep.contains({
        username: 'forscher2@example.com',
        role: 'Forscher',
        studies: ['AnotherStudy'],
      });
    });

    it('should return HTTP 200 with accounts filtered by study name for SysAdmin', async function () {
      // Arrange
      mockGetProfessionalAccountsByStudyName(testSandbox);
      const expectedResultCount = 7;
      const query = new URLSearchParams();
      query.append('studyName', 'TestStudy');

      // Act
      const result: Response<ProfessionalAccount[]> = await chai
        .request(apiAddress)
        .get('/admin/accounts?' + query.toString())
        .set(sysadminHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(expectedResultCount);
      expect(result.body).to.deep.contains({
        username: 'pm1@example.com',
        role: 'ProbandenManager',
        studies: ['TestStudy', 'AnotherStudy'],
      });
      expect(result.body).to.deep.contains({
        username: 'forscher1@example.com',
        role: 'Forscher',
        studies: ['TestStudy'],
      });
      expect(result.body).to.deep.contains({
        username: 'ut1@example.com',
        role: 'Untersuchungsteam',
        studies: ['TestStudy', 'AnotherStudy'],
      });
      expect(result.body).to.deep.contains({
        username: 'ut2@example.com',
        role: 'Untersuchungsteam',
        studies: ['TestStudy', 'AnotherStudy'],
      });
      expect(result.body).not.to.deep.contains({
        username: 'forscher3@example.com',
        role: 'Forscher',
        studies: ['AnotherStudy'],
      });
    });

    it('should return HTTP 200 with accounts filtered by study name and role for Forscher', async function () {
      // Arrange
      mockGetProfessionalAccountsByStudyName(testSandbox);
      const expectedResultCount = 3;
      const query = new URLSearchParams();
      query.append('studyName', 'TestStudy');

      // Act
      const result: Response<ProfessionalAccount[]> = await chai
        .request(apiAddress)
        .get('/admin/accounts?' + query.toString())
        .set(forscherHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(expectedResultCount);
      expect(result.body).to.deep.contains({
        username: 'forscher1@example.com',
        role: 'Forscher',
        studies: ['TestStudy'],
      });
      expect(result.body).to.deep.contains({
        username: 'forscher2@example.com',
        role: 'Forscher',
        studies: ['TestStudy', 'AnotherStudy'],
      });
    });

    it('should return HTTP 200 with accounts filtered by role for SysAdmin', async function () {
      // Arrange
      mockGetProfessionalAccountsByRole(testSandbox);
      const expectedResultCount = 2;
      const query = new URLSearchParams();
      query.append('role', 'ProbandenManager');

      // Act
      const result: Response<ProfessionalAccount[]> = await chai
        .request(apiAddress)
        .get('/admin/accounts?' + query.toString())
        .set(sysadminHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(expectedResultCount);
      expect(result.body).to.deep.contains({
        username: 'pm1@example.com',
        role: 'ProbandenManager',
        studies: ['TestStudy', 'AnotherStudy'],
      });
      expect(result.body).to.deep.contains({
        username: 'pm2@example.com',
        role: 'ProbandenManager',
        studies: [],
      });
    });

    it('should return HTTP 200 with only valid mail addresses as username for SysAdmin', async function () {
      // Arrange
      mockGetProfessionalAccountsByRole(testSandbox);
      const expectedResultCount = 8;
      const query = new URLSearchParams();
      query.append('onlyMailAddresses', 'true');

      // Act
      const result: Response<ProfessionalAccount[]> = await chai
        .request(apiAddress)
        .get('/admin/accounts?' + query.toString())
        .set(sysadminHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(expectedResultCount);
      expect(result.body).to.not.deep.contain({
        username: 'SysAdmin2',
        role: 'SysAdmin',
        studies: [],
      });
    });

    it('should return HTTP 200 without own account for Forscher', async function () {
      // Arrange
      mockGetProfessionalAccountsByStudyName(testSandbox);
      const expectedResultCount = 2;
      const query = new URLSearchParams();
      query.append('studyName', 'TestStudy');
      query.append('filterSelf', 'true');

      // Act
      const result: Response<ProfessionalAccount[]> = await chai
        .request(apiAddress)
        .get('/admin/accounts?' + query.toString())
        .set(forscherHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(expectedResultCount);
      expect(result.body).to.deep.contains({
        username: 'forscher2@example.com',
        role: 'Forscher',
        studies: ['TestStudy', 'AnotherStudy'],
      });
      expect(result.body).to.deep.contains({
        username: 'forscher3@example.com',
        role: 'Forscher',
        studies: ['TestStudy', 'AnotherStudy'],
      });
    });

    it('should return HTTP 200 with accounts only with access level "admin" for SysAdmin', async function () {
      // Arrange
      mockGetProfessionalAccountsByRole(testSandbox);
      const expectedResultCount = 3;
      const query = new URLSearchParams();
      query.append('accessLevel', 'admin');

      // Act
      const result: Response<ProfessionalAccount[]> = await chai
        .request(apiAddress)
        .get('/admin/accounts?' + query.toString())
        .set(sysadminHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(expectedResultCount);
      expect(result.body).to.deep.contains({
        username: 'forscher1@example.com',
        role: 'Forscher',
        studies: ['TestStudy'],
      });
      expect(result.body).to.deep.contains({
        username: 'ut2@example.com',
        role: 'Untersuchungsteam',
        studies: ['TestStudy', 'AnotherStudy'],
      });
    });

    it('should return HTTP 200 with accounts only with access level "admin" for Study "TestStudy"', async function () {
      // Arrange
      mockGetProfessionalAccountsByStudyName(testSandbox);
      const expectedResultCount = 1;
      const query = new URLSearchParams();
      query.append('accessLevel', 'admin');
      query.append('studyName', 'TestStudy');

      // Act
      const result: Response<ProfessionalAccount[]> = await chai
        .request(apiAddress)
        .get('/admin/accounts?' + query.toString())
        .set(forscherHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(expectedResultCount);
      expect(result.body).to.deep.contains({
        username: 'forscher1@example.com',
        role: 'Forscher',
        studies: ['TestStudy'],
      });
    });
  });
});
