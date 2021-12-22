/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import fetchMocker from 'fetch-mock';
import JWT from 'jsonwebtoken';

import {
  ListeningDbClient,
  MailService,
  AccessToken,
} from '@pia/lib-service-core';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { FcmHelper } from '../../src/services/fcmHelper';
import { Server } from '../../src/server';
import secretOrPrivateKey from '../secretOrPrivateKey';
import { setup, cleanup } from './email.spec.data/setup.helper';
import { StatusCodes } from 'http-status-codes';
import { config } from '../../src/config';
import { Notification } from '../../src/models/notification';

chai.use(chaiHttp);
const expect = chai.expect;
const fetchMock = fetchMocker.sandbox();

const apiAddress =
  'http://localhost:' + config.public.port.toString() + '/notification';

const testSandbox = sinon.createSandbox();
const suiteSandbox = sinon.createSandbox();

const pmSession: AccessToken = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
  groups: ['QTestStudy1'],
};

describe('/notification/email', () => {
  before(async () => {
    suiteSandbox.stub(ListeningDbClient.prototype);
    suiteSandbox.stub(FcmHelper, 'sendDefaultNotification');
    suiteSandbox.stub(FcmHelper, 'initFBAdmin');
    suiteSandbox.stub(MailService, 'initService');
    suiteSandbox.stub(MailService, 'sendMail').resolves(true);
    await setup();
    await Server.init();
  });

  after(async () => {
    await Server.stop();
    await cleanup();
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

  describe('POST /notification/email', () => {
    it('should return HTTP 401 when the token is wrong', async () => {
      // Arrange
      const invalidHeader = {
        authorization: JWT.sign(pmSession, 'thisIsNotAValidPrivateKey', {
          expiresIn: '24h',
        }),
      };

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/email')
        .set(invalidHeader);

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 401 when the token is missing', async () => {
      // Arrange

      // Act
      const result = await chai.request(apiAddress).post('/email');

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 when a Proband tries', async () => {
      // Arrange
      const probandHeader = {
        authorization: sign({
          id: 1,
          role: 'Proband',
          username: 'QTestProband1',
          groups: ['QTestStudy1'],
        }),
      };

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/email')
        .set(probandHeader)
        .send(createEmailRequest());

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a Forscher tries', async () => {
      // Arrange
      const forscherHeader = {
        authorization: sign({
          id: 1,
          role: 'Forscher',
          username: 'QTestForscher1',
          groups: ['QTestStudy1'],
        }),
      };

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/email')
        .set(forscherHeader)
        .send(createEmailRequest());

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a UT tries', async () => {
      // Arrange
      const utHeader = {
        authorization: sign({
          id: 1,
          role: 'Untersuchungsteam',
          username: 'QTestUntersuchungsteam1',
          groups: ['QTestStudy1'],
        }),
      };

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/email')
        .set(utHeader)
        .send(createEmailRequest());

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a SysAdmin tries', async () => {
      // Arrange
      const utHeader = {
        authorization: sign({
          id: 1,
          role: 'SysAdmin',
          username: 'QTestSysAdmin1',
          groups: ['QTestStudy1'],
        }),
      };

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/email')
        .set(utHeader)
        .send(createEmailRequest());

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 when a PM tries for pseudonym of study without access', async () => {
      // Arrange
      const pmHeader = { authorization: sign(pmSession) };
      fetchMock.get('express:/user/professional/:username/allProbands', [
        'QTestProband1',
        'QTestProband2',
      ]);

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/email')
        .set(pmHeader)
        .send(createEmailRequest(['QTestProband1', 'QTestProband99']));

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if no receipient has an email entry', async () => {
      // Arrange
      const pmHeader = { authorization: sign(pmSession) };
      fetchMock
        .get('express:/user/professional/:username/allProbands', [
          'QTestProband1',
          'QTestProband2',
        ])
        .get(
          'express:/personal/personalData/proband/:username/email',
          StatusCodes.NOT_FOUND
        );

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/email')
        .set(pmHeader)
        .send(createEmailRequest(['QTestProband1', 'QTestProband2']));

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 and mail addresses of mails which were sent', async () => {
      // Arrange
      const pmHeader = { authorization: sign(pmSession) };
      fetchMock
        .get('express:/user/professional/:username/allProbands', {
          body: JSON.stringify(['QTestProband1', 'QTestProband2']),
        })
        .get('express:/personal/personalData/proband/QTestProband1/email', {
          body: 'qtestproband1@example.com',
        })
        .get(
          'express:/personal/personalData/proband/QTestProband2/email',
          StatusCodes.NOT_FOUND
        );

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/email')
        .set(pmHeader)
        .send(createEmailRequest(['QTestProband1', 'QTestProband2']));

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.lengthOf(1);
      expect(result.body).to.include('qtestproband1@example.com');
    });
  });

  function createEmailRequest(recipients = ['QTestProband1']): Notification {
    return {
      recipients,
      title: 'test subject',
      body: 'test content',
    };
  }

  function sign(session: AccessToken): string {
    return JWT.sign(session, secretOrPrivateKey, {
      algorithm: 'RS512',
      expiresIn: '24h',
    });
  }
});
