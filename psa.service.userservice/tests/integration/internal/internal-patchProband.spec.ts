/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import { StatusCodes } from 'http-status-codes';
import { cleanup, setup } from './internal-patchProband.spec.data/setup.helper';
import { Server } from '../../../src/server';
import { config } from '../../../src/config';
import { ProbandStatusPatch } from '../../../src/models/proband';
import { ProbandStatus } from '../../../src/models/probandStatus';
import { SinonStubbedInstance } from 'sinon';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { probandAuthClient } from '../../../src/clients/authServerClient';
import { MailService } from '@pia/lib-service-core';
import * as sinon from 'sinon';
import {
  MessageQueueClient,
  MessageQueueTestUtils,
} from '@pia/lib-messagequeue';

chai.use(chaiHttp);
chai.use(sinonChai);

const internalApiAddress = `http://localhost:${config.internal.port}`;

const testSandbox = sinon.createSandbox();

describe('Internal: patch proband', function () {
  const mqc = new MessageQueueClient(config.servers.messageQueue);

  before(async function () {
    await Server.init();
    await mqc.connect(true);
    await mqc.createConsumer('proband.deactivated', async () =>
      Promise.resolve()
    );
  });

  after(async function () {
    await mqc.disconnect();
    await Server.stop();
  });

  beforeEach(async function () {
    await setup();
  });

  afterEach(async function () {
    testSandbox.restore();
    await cleanup();
  });

  describe('PATCH /user/users/{pseudonym}', function () {
    describe('update status', function () {
      it('should return 404 if user does not exist in DB', async function () {
        // Arrange
        const body: ProbandStatusPatch = { status: ProbandStatus.DEACTIVATED };

        // Act
        const result = await chai
          .request(internalApiAddress)
          .patch('/user/users/DoesNotExist')
          .send(body);

        // Assert
        expect(result).to.have.status(StatusCodes.NOT_FOUND);
      });

      it('should return 400 if study_status is not valid', async function () {
        // Arrange
        const body = { status: 'isnotvalid' };

        // Act
        const result = await chai
          .request(internalApiAddress)
          .patch('/user/users/qtest-proband1')
          .send(body);

        // Assert
        expect(result).to.have.status(StatusCodes.BAD_REQUEST);
      });

      it('should update the user`s status', async () => {
        // Arrange
        const body: ProbandStatusPatch = { status: ProbandStatus.DEACTIVATED };

        // Act
        const result = await chai
          .request(internalApiAddress)
          .patch('/user/users/qtest-proband1')
          .send(body);

        // Assert
        expect(result).to.have.status(StatusCodes.NO_CONTENT);
      });

      it('should send the "proband.deactivated" message', async function () {
        // Arrange
        const body: ProbandStatusPatch = { status: ProbandStatus.DEACTIVATED };
        const probandDeactivated =
          MessageQueueTestUtils.injectMessageProcessedAwaiter(
            mqc,
            'proband.deactivated',
            testSandbox
          );

        // Act
        await chai
          .request(internalApiAddress)
          .patch('/user/users/qtest-proband1')
          .send(body);

        // Assert
        await probandDeactivated;
      });
    });

    describe('update compliance contact', function () {
      let authClientUsersMock: SinonStubbedInstance<Users>;

      beforeEach(() => {
        authClientUsersMock = testSandbox.stub(probandAuthClient.users);
        authClientUsersMock.find.resolves([
          { username: 'qtest-proband1', id: '1234' },
        ]);
        authClientUsersMock.del.resolves();

        testSandbox.stub(MailService, 'sendMail').resolves(true);
      });

      it('should send the "proband.deactivated" message', async function () {
        // Arrange
        const body = { complianceContact: false };

        const probandDeactivated =
          MessageQueueTestUtils.injectMessageProcessedAwaiter(
            mqc,
            'proband.deactivated',
            testSandbox
          );

        // Act
        await chai
          .request(internalApiAddress)
          .patch('/user/users/qtest-proband1')
          .send(body);

        // Assert
        await probandDeactivated;
      });

      it('should return 404 if user does not exist in authserver', async function () {
        // Arrange
        authClientUsersMock.find.resolves([]);
        const body = { complianceContact: false };

        // Act
        const result = await chai
          .request(internalApiAddress)
          .patch('/user/users/qtest-proband1')
          .send(body);

        // Assert
        expect(result).to.have.status(StatusCodes.NOT_FOUND);
      });

      it('should delete the probands account', async function () {
        // Arrange
        const body = { complianceContact: false };

        // Act
        await chai
          .request(internalApiAddress)
          .patch('/user/users/qtest-proband1')
          .send(body);

        // Assert
        expect(authClientUsersMock.del).to.have.been.calledWith({
          id: '1234',
          realm: 'pia-proband-realm',
        });
      });
    });
  });
});
