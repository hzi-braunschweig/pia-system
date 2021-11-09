/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const sinon = require('sinon');
const fetchMock = require('fetch-mock').sandbox();
const fetch = require('node-fetch');

const { ListeningDbClient, MailService } = require('@pia/lib-service-core');
const { FcmHelper } = require('../../src/services/fcmHelper');

const { setup, cleanup } = require('./email.spec.data/setup.helper');

const secretOrPrivateKey = require('../secretOrPrivateKey');
const { Server } = require('../../src/server');

const testSandbox = sinon.createSandbox();

const JWT = require('jsonwebtoken');

const apiAddress = 'http://localhost:' + process.env.PORT + '/notification';

const suiteSandbox = sinon.createSandbox();

const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
  groups: ['QTestStudy1'],
};

describe('/notification/email', () => {
  before(async function () {
    suiteSandbox.stub(ListeningDbClient.prototype);
    suiteSandbox.stub(FcmHelper, 'sendDefaultNotification');
    suiteSandbox.stub(FcmHelper, 'initFBAdmin');
    suiteSandbox.stub(MailService, 'initService');
    suiteSandbox.stub(MailService, 'sendMail').resolves(true);
    await setup();
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    await cleanup();
    suiteSandbox.restore();
  });

  beforeEach(async () => {
    testSandbox.stub(fetch, 'default').callsFake(fetchMock);
    fetchMock.catch(503);
  });

  afterEach(async () => {
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
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 401 when the token is missing', async () => {
      // Arrange

      // Act
      const result = await chai.request(apiAddress).post('/email');

      // Assert
      expect(result, result.text).to.have.status(401);
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
      expect(result, result.text).to.have.status(403);
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
      expect(result, result.text).to.have.status(403);
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
      expect(result, result.text).to.have.status(403);
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
      expect(result, result.text).to.have.status(403);
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
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 404 if no receipient has an email entry', async () => {
      // Arrange
      const pmHeader = { authorization: sign(pmSession) };
      fetchMock
        .get('express:/user/professional/:username/allProbands', [
          'QTestProband1',
          'QTestProband2',
        ])
        .get('express:/personal/personalData/proband/:username/email', 404);

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/email')
        .set(pmHeader)
        .send(createEmailRequest(['QTestProband1', 'QTestProband2']));

      // Assert
      expect(result, result.text).to.have.status(404);
    });

    it('should return HTTP 200 and mail addresses of mails which were sent', async () => {
      // Arrange
      const pmHeader = { authorization: sign(pmSession) };
      fetchMock
        .get('express:/user/professional/:username/allProbands', [
          'QTestProband1',
          'QTestProband2',
        ])
        .get(
          'express:/personal/personalData/proband/QTestProband1/email',
          'qtestproband1@example.com'
        )
        .get('express:/personal/personalData/proband/QTestProband2/email', 404);

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/email')
        .set(pmHeader)
        .send(createEmailRequest(['QTestProband1', 'QTestProband2']));

      // Assert
      expect(result, result.text).to.have.status(200);
      expect(result.body).to.be.an('array');
      expect(result.body).to.have.lengthOf(1);
      expect(result.body).to.include('qtestproband1@example.com');
    });
  });

  function createEmailRequest(recipients = ['QTestProband1']) {
    return {
      recipients,
      title: 'test subject',
      body: 'test content',
    };
  }

  function sign(session) {
    return JWT.sign(session, secretOrPrivateKey, {
      algorithm: 'RS512',
      expiresIn: '24h',
    });
  }
});
