/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { config } from '../../src/config';
import sinon, { createSandbox } from 'sinon';
import fetchMocker from 'fetch-mock';
import {
  MessageQueueClient,
  MessageQueueTestUtils,
} from '@pia/lib-messagequeue';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { Server } from '../../src/server';
import { cleanup, setup } from './probandAccount.spec.data/setup.helper';
import chai, { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import chaiHttp from 'chai-http';
import JWT from 'jsonwebtoken';
import secretOrPrivateKey from '../secretOrPrivateKey';
import { db } from '../../src/db';
import { getRepository } from 'typeorm';
import { Proband } from '../../src/entities/proband';

chai.use(chaiHttp);

const probandSession = {
  id: 1,
  role: 'Proband',
  username: 'qtest-proband1',
  groups: ['QTestStudy1'],
};
const researcherSession = {
  id: 1,
  role: 'Forscher',
  username: 'researcher1@example.com',
  groups: ['QTestStudy1'],
};
const investigatorSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'investigationteam1@example.com',
  groups: ['QTestStudy1', 'QTestStudy3'],
};
const sysadminSession = {
  id: 1,
  role: 'SysAdmin',
  username: 'QTestSystemAdmin1',
};
const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm1@example.com',
  groups: ['QTestStudy1'],
};

const probandHeader = {
  authorization: JWT.sign(probandSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};
const researcherHeader = {
  authorization: JWT.sign(researcherSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};
const investigatorHeader = {
  authorization: JWT.sign(investigatorSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};
const sysadminHeader = {
  authorization: JWT.sign(sysadminSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};
const pmHeader = {
  authorization: JWT.sign(pmSession, secretOrPrivateKey, {
    algorithm: 'RS512',
    expiresIn: '24h',
  }),
};

const apiAddress = `http://localhost:${config.public.port}`;

describe('/user/probands/{pseudonym}/account', () => {
  const testSandbox = createSandbox();
  const suiteSandbox = sinon.createSandbox();
  const fetchMock = fetchMocker.sandbox();

  const mqc = new MessageQueueClient(config.servers.messageQueue);

  before(async function () {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    suiteSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    await Server.init();
    await mqc.connect(true);
  });

  after(async function () {
    await mqc.disconnect();
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(async function () {
    await setup();
  });

  afterEach(async function () {
    await cleanup();
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('DELETE /user/probands/{pseudonym}/account', () => {
    it('should return 401 if no token is applied', async () => {
      // Arrange
      const pseudonym = 'qtest-proband1';

      // Act
      const response = await chai
        .request(apiAddress)
        .delete(`/user/probands/${pseudonym}/account`);

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
        .delete(`/user/probands/${pseudonym}/account`)
        .set(researcherHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
      response = await chai
        .request(apiAddress)
        .delete(`/user/probands/${pseudonym}/account`)
        .set(pmHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
      response = await chai
        .request(apiAddress)
        .delete(`/user/probands/${pseudonym}/account`)
        .set(investigatorHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
      response = await chai
        .request(apiAddress)
        .delete(`/user/probands/${pseudonym}/account`)
        .set(sysadminHeader);
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 403 if proband tries for another pseudonym', async () => {
      // Arrange
      const pseudonym = 'qtest-other-proband';

      // Act
      const response = await chai
        .request(apiAddress)
        .delete(`/user/probands/${pseudonym}/account`)
        .set(probandHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    describe('deletionType=full', () => {
      beforeEach(async () => {
        await mqc.createConsumer('proband.deleted', async () => {
          return Promise.resolve();
        });
      });

      it('should return 204 if proband tries with its own pseudonym', async () => {
        // Arrange
        const pseudonym = 'qtest-proband1';

        // Act
        const response = await chai
          .request(apiAddress)
          .delete(`/user/probands/${pseudonym}/account?deletionType=full`)
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
          .delete(`/user/probands/${pseudonym}/account?deletionType=full`)
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
          .delete(`/user/probands/${pseudonym}/account?deletionType=full`)
          .set(probandHeader);

        // Assert
        await db.none(
          "SELECT * FROM accounts WHERE username = 'qtest-proband1'"
        );
      });

      it('should send a "proband.deleted" message', async () => {
        // Arrange
        const probandDeleted =
          MessageQueueTestUtils.injectMessageProcessedAwaiter(
            mqc,
            'proband.deleted',
            testSandbox
          );

        // Act
        const response = await chai
          .request(apiAddress)
          .delete(`/user/probands/qtest-proband1/account?deletionType=full`)
          .set(probandHeader);

        // Assert
        expect(response).to.have.status(StatusCodes.NO_CONTENT);
        await probandDeleted;
      });

      it('should fully delete the proband`s data', async () => {
        // Arrange
        const pseudonym = 'qtest-proband1';

        // Act
        await chai
          .request(apiAddress)
          .delete(`/user/probands/${pseudonym}/account?deletionType=full`)
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
        await mqc.createConsumer('proband.deactivated', async () => {
          return Promise.resolve();
        });

        fetchMock.delete('express:/auth/user/:pseudonym', () => ({
          body: null,
        }));
      });

      it('should return 204 if proband tries with its own pseudonym', async () => {
        // Arrange
        const pseudonym = 'qtest-proband1';

        // Act
        const response = await chai
          .request(apiAddress)
          .delete(`/user/probands/${pseudonym}/account?deletionType=contact`)
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
          .delete(`/user/probands/${pseudonym}/account?deletionType=contact`)
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
          .delete(`/user/probands/${pseudonym}/account?deletionType=contact`)
          .set(probandHeader);

        // Assert
        expect(fetchMock.called()).to.be.true;
      });

      it('should send a "proband.deactivated" message', async () => {
        // Arrange
        const probandDeleted =
          MessageQueueTestUtils.injectMessageProcessedAwaiter(
            mqc,
            'proband.deleted',
            testSandbox
          );

        // Act
        const response = await chai
          .request(apiAddress)
          .delete(`/user/probands/qtest-proband1/account?deletionType=full`)
          .set(probandHeader);

        // Assert
        expect(response).to.have.status(StatusCodes.NO_CONTENT);
        await probandDeleted;
      });

      it('should not delete the proband`s health data', async () => {
        // Arrange
        const pseudonym = 'qtest-proband1';
        const expectedQuestionnaireInstancesCount = 2;
        const expectedLabResultsCount = 3;

        // Act
        await chai
          .request(apiAddress)
          .delete(`/user/probands/${pseudonym}/account?deletionType=contact`)
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
