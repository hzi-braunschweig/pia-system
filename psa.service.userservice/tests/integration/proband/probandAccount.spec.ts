/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { config } from '../../../src/config';
import sinon, { createSandbox, SinonStubbedInstance } from 'sinon';
import {
  MessageQueueClient,
  MessageQueueTopic,
  ProbandDeletedMessage,
  ProbandDeactivatedMessage,
  MessageQueueTestUtils,
} from '@pia/lib-messagequeue';
import { Server } from '../../../src/server';
import { cleanup, setup } from './probandAccount.spec.data/setup.helper';
import chai, { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import chaiHttp from 'chai-http';
import { db } from '../../../src/db';
import { getRepository } from 'typeorm';
import { Proband } from '../../../src/entities/proband';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { mockDeleteProbandAccount } from '../accountServiceRequestMock.helper.spec';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { probandAuthClient } from '../../../src/clients/authServerClient';

chai.use(chaiHttp);

const probandHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTestStudy1'],
});
const researcherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'researcher1@example.com',
  studies: ['QTestStudy1'],
});
const investigatorHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'investigationteam1@example.com',
  studies: ['QTestStudy1', 'QTestStudy3'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin1',
  studies: [],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'pm1@example.com',
  studies: ['QTestStudy1'],
});

const apiAddress = `http://localhost:${config.public.port}`;

describe('/probands/{pseudonym}/account', () => {
  const testSandbox = createSandbox();
  const suiteSandbox = sinon.createSandbox();

  const mqc = new MessageQueueClient(config.servers.messageQueue);

  before(async function () {
    await Server.init();
    await mqc.connect(true);
  });

  after(async function () {
    await mqc.disconnect();
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(async function () {
    AuthServerMock.probandRealm().returnValid();
    await setup();
  });

  afterEach(async function () {
    AuthServerMock.cleanAll();
    await cleanup();
    testSandbox.restore();
  });

  describe('DELETE /probands/{pseudonym}/account', () => {
    let authClientUsersStub: SinonStubbedInstance<Users>;

    beforeEach(() => {
      authClientUsersStub = mockDeleteProbandAccount(testSandbox, [
        'qtest-proband1',
      ]);
    });

    it('should return 401 if no token is applied', async () => {
      // Arrange
      const pseudonym = 'qtest-proband1';

      // Act
      const response = await chai
        .request(apiAddress)
        .delete(`/probands/${pseudonym}/account`);

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 if user is not a proband', async () => {
      // Arrange
      const pseudonym = 'qtest-proband1';
      let response;

      // Act & Assert
      response = await chai
        .request(apiAddress)
        .delete(`/probands/${pseudonym}/account`)
        .set(researcherHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
      AuthServerMock.probandRealm().returnValid();

      response = await chai
        .request(apiAddress)
        .delete(`/probands/${pseudonym}/account`)
        .set(pmHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
      AuthServerMock.probandRealm().returnValid();

      response = await chai
        .request(apiAddress)
        .delete(`/probands/${pseudonym}/account`)
        .set(investigatorHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
      AuthServerMock.probandRealm().returnValid();

      response = await chai
        .request(apiAddress)
        .delete(`/probands/${pseudonym}/account`)
        .set(sysadminHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 403 if proband tries for another pseudonym', async () => {
      // Arrange
      const pseudonym = 'qtest-other-proband';

      // Act
      const response = await chai
        .request(apiAddress)
        .delete(`/probands/${pseudonym}/account`)
        .set(probandHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    describe('deletionType=full', () => {
      beforeEach(async () => {
        await mqc.createConsumer(MessageQueueTopic.PROBAND_DELETED, async () =>
          Promise.resolve()
        );
      });

      it('should return 204 if proband tries with its own pseudonym', async () => {
        // Arrange
        const pseudonym = 'qtest-proband1';

        // Act
        const response = await chai
          .request(apiAddress)
          .delete(`/probands/${pseudonym}/account?deletionType=full`)
          .set(probandHeader);

        // Assert
        expect(response).to.have.status(StatusCodes.NO_CONTENT);
      });

      it('should save the timestamp of the deletion', async () => {
        // Arrange
        const pseudonym = 'qtest-proband1';
        const timeBeforeRequest = new Date();

        // Act
        await chai
          .request(apiAddress)
          .delete(`/probands/${pseudonym}/account?deletionType=full`)
          .set(probandHeader);
        const timeAfterRequest = new Date();
        const proband = await getRepository(Proband).findOne({ pseudonym });

        // Assert
        expect(proband?.deletedAt).to.be.above(timeBeforeRequest);
        expect(proband?.deletedAt).to.be.below(timeAfterRequest);
        expect(proband?.deactivatedAt).to.be.null;
      });

      it('should delete the corresponding account', async () => {
        // Arrange
        const pseudonym = 'qtest-proband1';

        // Act
        await chai
          .request(apiAddress)
          .delete(`/probands/${pseudonym}/account?deletionType=full`)
          .set(probandHeader);

        // Assert
        authClientUsersStub.del.calledOnceWith({
          id: '1',
          realm: probandAuthClient.realm,
        });
      });

      it('should send a "proband.deleted" message', async () => {
        // Arrange
        const expectedMessage: ProbandDeletedMessage = {
          /**
           * This `deletionType` is not equal to the requests deletion type, participants can send.
           * @see ProbandSelfDeletionType - request deletion type
           * @see ProbandDeletionType - executed deletion type
           */
          deletionType: 'default',
          pseudonym: 'qtest-proband1',
          studyName: 'QTestStudy1',
        };

        const probandDeleted =
          MessageQueueTestUtils.injectMessageProcessedAwaiter<ProbandDeletedMessage>(
            mqc,
            MessageQueueTopic.PROBAND_DELETED,
            testSandbox
          );

        // Act
        const response = await chai
          .request(apiAddress)
          .delete(`/probands/qtest-proband1/account?deletionType=full`)
          .set(probandHeader);

        // Assert
        expect(response).to.have.status(StatusCodes.NO_CONTENT);
        expect(await probandDeleted).to.deep.contain({
          message: expectedMessage,
        });
      });

      it('should fully delete the proband`s data', async () => {
        // Arrange
        const pseudonym = 'qtest-proband1';

        // Act
        await chai
          .request(apiAddress)
          .delete(`/probands/${pseudonym}/account?deletionType=full`)
          .set(probandHeader);

        // Assert
        await db.none(
          'SELECT * FROM questionnaire_instances WHERE user_id = $(pseudonym)',
          { pseudonym }
        );
        await db.none('SELECT * FROM user_files WHERE user_id = $(pseudonym)', {
          pseudonym,
        });
        await db.none(
          'SELECT * FROM lab_results WHERE user_id = $(pseudonym)',
          { pseudonym }
        );
        await db.none(
          'SELECT * FROM blood_samples WHERE user_id = $(pseudonym)',
          { pseudonym }
        );
        await db.none(
          'SELECT * FROM notification_schedules WHERE user_id = $(pseudonym)',
          { pseudonym }
        );
      });
    });

    describe('deletionType=contact', () => {
      beforeEach(async () => {
        await mqc.createConsumer(
          MessageQueueTopic.PROBAND_DEACTIVATED,
          async () => Promise.resolve()
        );
      });

      it('should return 204 if proband tries with its own pseudonym', async () => {
        // Arrange
        const pseudonym = 'qtest-proband1';

        // Act
        const response = await chai
          .request(apiAddress)
          .delete(`/probands/${pseudonym}/account?deletionType=contact`)
          .set(probandHeader);

        // Assert
        expect(response).to.have.status(StatusCodes.NO_CONTENT);
      });

      it('should save the timestamp of the deactivation', async () => {
        // Arrange
        const pseudonym = 'qtest-proband1';
        const timeBeforeRequest = new Date();

        // Act
        await chai
          .request(apiAddress)
          .delete(`/probands/${pseudonym}/account?deletionType=contact`)
          .set(probandHeader);
        const timeAfterRequest = new Date();
        const proband = await getRepository(Proband).findOne({ pseudonym });

        // Assert
        expect(proband?.deactivatedAt).to.be.above(timeBeforeRequest);
        expect(proband?.deactivatedAt).to.be.below(timeAfterRequest);
        expect(proband?.deletedAt).to.be.null;
      });

      it('should delete the corresponding account', async () => {
        // Arrange
        const pseudonym = 'qtest-proband1';

        // Act
        await chai
          .request(apiAddress)
          .delete(`/probands/${pseudonym}/account?deletionType=contact`)
          .set(probandHeader);

        // Assert
        authClientUsersStub.del.calledOnceWith({
          id: '1',
          realm: probandAuthClient.realm,
        });
      });

      it('should send a "proband.deactivated" message', async () => {
        // Arrange
        const expectedMessage: ProbandDeactivatedMessage = {
          pseudonym: 'qtest-proband1',
          studyName: 'QTestStudy1',
        };

        const probandDeactivated =
          MessageQueueTestUtils.injectMessageProcessedAwaiter<ProbandDeactivatedMessage>(
            mqc,
            MessageQueueTopic.PROBAND_DEACTIVATED,
            testSandbox
          );

        // Act
        const response = await chai
          .request(apiAddress)
          .delete(`/probands/qtest-proband1/account?deletionType=contact`)
          .set(probandHeader);

        // Assert
        expect(response).to.have.status(StatusCodes.NO_CONTENT);
        expect(await probandDeactivated).to.deep.contain({
          message: expectedMessage,
        });
      });

      it('should not delete the proband`s health data', async () => {
        // Arrange
        const pseudonym = 'qtest-proband1';
        const expectedQuestionnaireInstancesCount = 2;
        const expectedLabResultsCount = 3;

        // Act
        await chai
          .request(apiAddress)
          .delete(`/probands/${pseudonym}/account?deletionType=contact`)
          .set(probandHeader);

        // Assert
        const qInstances = await db.many<unknown>(
          'SELECT * FROM questionnaire_instances WHERE user_id = $(pseudonym)',
          { pseudonym }
        );
        expect(qInstances).to.have.length(expectedQuestionnaireInstancesCount);
        await db.one('SELECT * FROM user_files WHERE user_id = $(pseudonym)', {
          pseudonym,
        });
        const labResults = await db.many<unknown>(
          'SELECT * FROM lab_results WHERE user_id = $(pseudonym)',
          {
            pseudonym,
          }
        );
        expect(labResults).to.have.length(expectedLabResultsCount);
        await db.one(
          'SELECT * FROM blood_samples WHERE user_id = $(pseudonym)',
          { pseudonym }
        );
        await db.one(
          'SELECT * FROM notification_schedules WHERE user_id = $(pseudonym)',
          { pseudonym }
        );
      });
    });
  });
});
