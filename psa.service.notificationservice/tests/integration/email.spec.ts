/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import fetchMocker from 'fetch-mock';

import {
  AuthServerMock,
  AuthTokenMockBuilder,
  ListeningDbClient,
  MailService,
} from '@pia/lib-service-core';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { FcmHelper } from '../../src/services/fcmHelper';
import { Server } from '../../src/server';
import { StatusCodes } from 'http-status-codes';
import { config } from '../../src/config';
import { Notification } from '../../src/models/notification';

chai.use(chaiHttp);
const expect = chai.expect;
const fetchMock = fetchMocker.sandbox();

const apiAddress = `http://localhost:${config.public.port}`;

const testSandbox = sinon.createSandbox();
const suiteSandbox = sinon.createSandbox();

describe('/admin/email', () => {
  beforeEach(() => AuthServerMock.adminRealm().returnValid());
  afterEach(AuthServerMock.cleanAll);

  before(async () => {
    suiteSandbox.stub(ListeningDbClient.prototype);
    suiteSandbox.stub(FcmHelper, 'sendDefaultNotification');
    suiteSandbox.stub(FcmHelper, 'initFBAdmin');
    suiteSandbox.stub(MailService, 'initService');
    suiteSandbox.stub(MailService, 'sendMail').resolves(true);
    await Server.init();
  });

  after(async () => {
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('POST /admin/email', () => {
    it('should return HTTP 401 when the token is wrong', async () => {
      // Arrange
      const probandHeader = AuthTokenMockBuilder.createAuthHeader({
        roles: ['Proband'],
        username: 'qtest-proband1',
        studies: ['QTestStudy1'],
      });
      AuthServerMock.cleanAll();
      AuthServerMock.probandRealm().returnInvalid();

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/email')
        .set(probandHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 401 when the token is missing', async () => {
      // Arrange

      // Act
      const result = await chai.request(apiAddress).post('/admin/email');

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a Proband tries', async () => {
      // Arrange
      const probandHeader = AuthTokenMockBuilder.createAuthHeader({
        roles: ['Proband'],
        username: 'qtest-proband1',
        studies: ['QTestStudy1'],
      });

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/email')
        .set(probandHeader)
        .send(createEmailRequest());

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Forscher tries', async () => {
      // Arrange
      const forscherHeader = AuthTokenMockBuilder.createAuthHeader({
        roles: ['Forscher'],
        username: 'qtest-forscher1',
        studies: ['QTestStudy1'],
      });

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/email')
        .set(forscherHeader)
        .send(createEmailRequest());

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a UT tries', async () => {
      // Arrange
      const utHeader = AuthTokenMockBuilder.createAuthHeader({
        roles: ['Untersuchungsteam'],
        username: 'qtest-untersuchungsteam1',
        studies: ['QTestStudy1'],
      });

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/email')
        .set(utHeader)
        .send(createEmailRequest());

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a SysAdmin tries', async () => {
      // Arrange
      const utHeader = AuthTokenMockBuilder.createAuthHeader({
        roles: ['SysAdmin'],
        username: 'qtest-sysadmin1',
        studies: ['QTestStudy1'],
      });

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/email')
        .set(utHeader)
        .send(createEmailRequest());

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a PM tries for pseudonym of study without access', async () => {
      // Arrange
      const pmHeader = AuthTokenMockBuilder.createAuthHeader({
        roles: ['ProbandenManager'],
        username: 'qtest-probandenmanager',
        studies: ['QTestStudy1'],
      });
      fetchMock.get('express:/user/professional/:username/allProbands', [
        'qtest-proband1',
        'qtest-proband2',
      ]);

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/email')
        .set(pmHeader)
        .send(createEmailRequest(['qtest-proband1', 'qtest-proband99']));

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if no receipient has an email entry', async () => {
      // Arrange
      const pmHeader = AuthTokenMockBuilder.createAuthHeader({
        roles: ['ProbandenManager'],
        username: 'qtest-probandenmanager',
        studies: ['QTestStudy1'],
      });
      fetchMock
        .get('express:/user/professional/:username/allProbands', [
          'qtest-proband1',
          'qtest-proband2',
        ])
        .get(
          'express:/personal/personalData/proband/:username/email',
          StatusCodes.NOT_FOUND
        );

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/email')
        .set(pmHeader)
        .send(createEmailRequest(['qtest-proband1', 'qtest-proband2']));

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 and mail addresses of mails which were sent', async () => {
      // Arrange
      const pmHeader = AuthTokenMockBuilder.createAuthHeader({
        roles: ['ProbandenManager'],
        username: 'qtest-probandenmanager',
        studies: ['QTestStudy1'],
      });
      fetchMock
        .get('express:/user/professional/:username/allProbands', {
          body: JSON.stringify(['qtest-proband1', 'qtest-proband2']),
        })
        .get('express:/personal/personalData/proband/qtest-proband1/email', {
          body: 'qtest-proband1@example.com',
        })
        .get(
          'express:/personal/personalData/proband/qtest-proband2/email',
          StatusCodes.NOT_FOUND
        );

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/email')
        .set(pmHeader)
        .send(createEmailRequest(['qtest-proband1', 'qtest-proband2']));

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.lengthOf(1);
      expect(result.body).to.include('qtest-proband1@example.com');
    });

    it('should also accept a list of pseudonyms in uppercase and return HTTP 200', async () => {
      // Arrange
      const pmHeader = AuthTokenMockBuilder.createAuthHeader({
        roles: ['ProbandenManager'],
        username: 'qtest-probandenmanager',
        studies: ['QTestStudy1'],
      });
      fetchMock
        .get('express:/user/professional/:username/allProbands', {
          body: JSON.stringify(['qtest-proband1', 'qtest-proband2']),
        })
        .get('express:/personal/personalData/proband/qtest-proband1/email', {
          body: 'qtest-proband1@example.com',
        })
        .get(
          'express:/personal/personalData/proband/qtest-proband2/email',
          StatusCodes.NOT_FOUND
        );

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/email')
        .set(pmHeader)
        .send(createEmailRequest(['QTest-Proband1', 'QTest-Proband2']));

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.lengthOf(1);
      expect(result.body).to.include('qtest-proband1@example.com');
    });
  });

  function createEmailRequest(recipients = ['qtest-proband1']): Notification {
    return {
      recipients,
      title: 'test subject',
      body: 'test content',
    };
  }
});
