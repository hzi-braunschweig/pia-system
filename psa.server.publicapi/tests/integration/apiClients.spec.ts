/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createSandbox } from 'sinon';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { PublicApiServer } from '../../src/server';
import { config } from '../../src/config';
import {
  mockCreateApiClient,
  mockCreateApiClientConflict,
  mockDeleteApiClient,
  mockDeleteApiClientWithEmptyResponse,
  mockGetApiClients,
} from './accountServiceRequestMock.helper.spec';

chai.use(chaiHttp);

const sysAdminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'test-admin',
  studies: ['QTestStudy1', 'QTestStudy3', 'DoesNotExist'],
});

const forscherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'test-forscher',
  studies: ['QTestStudy1', 'QTestStudy3', 'DoesNotExist'],
});

const apiAddress = `http://localhost:${config.public.port}`;

describe('/admin/clients', () => {
  const testSandbox = createSandbox();
  let server: PublicApiServer;

  before(async function () {
    server = new PublicApiServer();
    await server.init();
  });

  after(async function () {
    await server.stop();
  });

  beforeEach(function () {
    AuthServerMock.adminRealm().returnValid();
  });

  afterEach(function () {
    AuthServerMock.cleanAll();
    testSandbox.restore();
  });

  describe('GET /admin/clients', () => {
    it('should return 401 if no auth token is appended', async () => {
      // Arrange

      // Act
      const response = await chai.request(apiAddress).get(`/admin/clients`);

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 401 if auth token is invalid', async () => {
      // Arrange
      AuthServerMock.cleanAll();
      AuthServerMock.adminRealm().returnInvalid();

      // Act
      const response = await chai
        .request(apiAddress)
        .get(`/admin/clients`)
        .set(sysAdminHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 if non SysAdmin role tries', async () => {
      // Arrange

      // Act
      const response = await chai
        .request(apiAddress)
        .get(`/admin/clients`)
        .set(forscherHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return available clients', async () => {
      // Arrange
      mockGetApiClients(testSandbox);

      // Act
      const response = await chai
        .request(apiAddress)
        .get(`/admin/clients`)
        .set(sysAdminHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.OK);
      expect(response.body).to.deep.equal([
        {
          clientId: 'pia-public-api-test-1',
          name: 'Test 1',
          secret: 'secret',
          studies: ['test-study-1', 'test-study-2'],
          createdAt: '2021-01-01',
        },
        {
          clientId: 'pia-public-api-test-2',
          name: 'Test 2',
          secret: 'secret',
          studies: ['test-study-1', 'test-study-2'],
          createdAt: '2023-12-31',
        },
      ]);
    });
  });

  describe('POST /admin/clients', () => {
    it('should return 401 if no auth token is appended', async () => {
      // Arrange

      // Act
      const response = await chai
        .request(apiAddress)
        .post(`/admin/clients`)
        .send({
          name: 'Test 1',
          studies: ['test-study-1', 'test-study-2'],
        });

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 401 if auth token is invalid', async () => {
      // Arrange
      AuthServerMock.cleanAll();
      AuthServerMock.adminRealm().returnInvalid();

      // Act
      const response = await chai
        .request(apiAddress)
        .post(`/admin/clients`)
        .set(sysAdminHeader)
        .send({
          name: 'Test 1',
          studies: ['test-study-1', 'test-study-2'],
        });

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 if non SysAdmin role tries', async () => {
      // Arrange

      // Act
      const response = await chai
        .request(apiAddress)
        .post(`/admin/clients`)
        .set(forscherHeader)
        .send({
          name: 'Test 1',
          studies: ['test-study-1', 'test-study-2'],
        });

      // Assert
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 409 if client with same name already exists', async () => {
      // Arrange
      mockCreateApiClientConflict(testSandbox);

      // Act
      const response = await chai
        .request(apiAddress)
        .post(`/admin/clients`)
        .set(sysAdminHeader)
        .send({ name: 'Test 1', studies: ['test-study-1'] });

      // Assert
      expect(response).to.have.status(StatusCodes.CONFLICT);
    });

    it('should return the created client', async () => {
      // Arrange
      mockCreateApiClient(testSandbox);

      // Act
      const response = await chai
        .request(apiAddress)
        .post(`/admin/clients`)
        .set(sysAdminHeader)
        .send({
          name: 'Test 1',
          studies: ['test-study-1', 'test-study-2'],
        });

      // Assert
      expect(response).to.have.status(StatusCodes.OK);
      expect(response.body).to.deep.equal({
        clientId: 'pia-public-api-test-1',
        name: 'Test 1',
        secret: 'secret',
        studies: ['test-study-1', 'test-study-2'],
        createdAt: '2024-01-01',
      });
    });
  });

  describe('DELETE /admin/clients/{clientId}', () => {
    it('should return 401 if no auth token is appended', async () => {
      // Arrange

      // Act
      const response = await chai
        .request(apiAddress)
        .delete(`/admin/clients/test-client`);

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 401 if auth token is invalid', async () => {
      // Arrange
      AuthServerMock.cleanAll();
      AuthServerMock.adminRealm().returnInvalid();

      // Act
      const response = await chai
        .request(apiAddress)
        .delete(`/admin/clients/test-client`)
        .set(sysAdminHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 if non SysAdmin role tries', async () => {
      // Arrange

      // Act
      const response = await chai
        .request(apiAddress)
        .delete(`/admin/clients/test-client`)
        .set(forscherHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it("should return 404 if the client doesn't exist", async () => {
      // Arrange
      mockDeleteApiClientWithEmptyResponse(testSandbox);

      // Act
      const response = await chai
        .request(apiAddress)
        .delete(`/admin/clients/does-not-exist`)
        .set(sysAdminHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should delete the corresponding client', async () => {
      // Arrange
      mockDeleteApiClient(testSandbox);

      // Act
      const response = await chai
        .request(apiAddress)
        .delete(`/admin/clients/test-client`)
        .set(sysAdminHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.NO_CONTENT);
    });
  });
});
