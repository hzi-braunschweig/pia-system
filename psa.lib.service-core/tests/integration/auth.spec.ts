/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';

import {
  AuthServerMock,
  AuthTokenMockBuilder,
  Response,
  SpecificError,
  TokenAttributes,
} from '../../src';
import { Server } from '../example-service/server';
import { config } from '../example-service/config';

chai.use(chaiHttp);
const expect = chai.expect;

const apiAddress = `http://localhost:${config.public.port}`;

describe('auth module', () => {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('Proband API', () => {
    it('should not accept unauthorized requests', async () => {
      const result = await chai.request(apiAddress).get('/example/Testname');
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should not accept invalid tokens', async () => {
      // Arrange
      const authRequest = AuthServerMock.probandRealm().returnInvalid();

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/example/Testname')
        .set({ authorization: 'Bearer this.isnot.valid' });

      // Assert
      authRequest.done();
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should only accept proband tokens', async () => {
      // Arrange
      const token = AuthTokenMockBuilder.createToken({
        username: 'testpm',
        roles: ['ProbandenManager'],
        studies: ['Teststudy'],
      });

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/example/Testname')
        .set({ authorization: token });

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return http 200 with an example for Proband role', async () => {
      // Arrange
      const tokenAttributes: TokenAttributes = {
        username: 'test-1234',
        roles: ['Proband'],
        studies: ['Teststudy'],
      };
      const authRequest = AuthServerMock.probandRealm().returnValid();

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/example/Testname')
        .set(AuthTokenMockBuilder.createAuthHeader(tokenAttributes));

      // Assert
      authRequest.done();
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body).to.eql({
        name: 'Testname',
        age: 21,
      });
    });
  });

  describe('Admin API', () => {
    it('should not accept unauthorized requests', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/study/Teststudy/example/Testname');
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should not accept invalid tokens', async () => {
      // Arrange
      const authRequest = AuthServerMock.adminRealm().returnInvalid();

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/study/Teststudy/example/Testname')
        .set({ authorization: 'Bearer this.isnot.valid' });

      // Assert
      authRequest.done();
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should not accept ProbandenManager role', async () => {
      // Arrange
      const authRequest = AuthServerMock.adminRealm().returnValid();

      // Act
      const result: Response<Error> = await chai
        .request(apiAddress)
        .get('/admin/study/Teststudy/example/Testname')
        .set(
          AuthTokenMockBuilder.createAuthHeader({
            username: 'testpm',
            roles: ['ProbandenManager'],
            studies: ['Teststudy'],
          })
        );

      // Assert
      authRequest.done();
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      expect(result.body.message).to.equal('Insufficient scope');
    });

    it('should not accept Forscher with wrong study', async () => {
      // Arrange
      const authRequest = AuthServerMock.adminRealm().returnValid();

      // Act
      const result: Response<SpecificError> = await chai
        .request(apiAddress)
        .get('/admin/study/Teststudy/example/Testname')
        .set(
          AuthTokenMockBuilder.createAuthHeader({
            username: 'testforscher',
            roles: ['Forscher'],
            studies: ['NotTheCorrectStudy'],
          })
        );

      // Assert
      authRequest.done();
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
      expect(result.body.errorCode).to.equal('MISSING_STUDY_ACCESS');
      expect(result.body.message).to.equal(
        'Requesting user has no access to study "Teststudy"'
      );
    });

    it('should return http 200 with an example for Forscher role', async () => {
      // Arrange
      const authRequest = AuthServerMock.adminRealm().returnValid();

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/study/Teststudy/example/Testname')
        .set(
          AuthTokenMockBuilder.createAuthHeader({
            username: 'testforscher',
            roles: ['Forscher'],
            studies: ['Teststudy'],
          })
        );

      // Assert
      authRequest.done();
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body).to.eql({
        study: 'Teststudy',
        name: 'Testname',
        age: 21,
      });
    });

    it('should return http 200 with an example for Untersuchungsteam role', async () => {
      // Arrange
      const authRequest = AuthServerMock.adminRealm().returnValid();

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/study/Teststudy/example/Testname')
        .set(
          AuthTokenMockBuilder.createAuthHeader({
            username: 'testut',
            roles: ['Untersuchungsteam'],
            studies: ['Teststudy'],
          })
        );

      // Assert
      authRequest.done();
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body).to.eql({
        study: 'Teststudy',
        name: 'Testname',
        age: 42,
      });
    });

    it('should return http 200 with an example for SysAdmin role', async () => {
      // Arrange
      const authRequest = AuthServerMock.adminRealm().returnValid();

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/study/Teststudy/example/Testname')
        .set(
          AuthTokenMockBuilder.createAuthHeader({
            username: 'testadmin',
            roles: ['SysAdmin'],
            studies: [],
          })
        );

      // Assert
      authRequest.done();
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body).to.eql({
        study: 'Teststudy',
        name: 'Testname',
        age: 84,
      });
    });
  });
});
