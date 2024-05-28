/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as util from 'util';
import * as sinon from 'sinon';
import { SinonStubbedInstance } from 'sinon';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import { StatusCodes } from 'http-status-codes';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';

import { MailService } from '@pia/lib-service-core';
import { db } from '../../../src/db';
import { Server } from '../../../src/server';
import { messageQueueService } from '../../../src/services/messageQueueService';
import {
  cleanup,
  setup,
} from './internal-deleteProbandData.spec.data/setup.helper';
import { config } from '../../../src/config';
import { ProbandDeletionType } from '../../../src/services/probandService';
import { ProbandStatus } from '../../../src/models/probandStatus';
import { probandAuthClient } from '../../../src/clients/authServerClient';
import { MessageQueueTopic } from '@pia/lib-messagequeue';

chai.use(chaiHttp);
chai.use(sinonChai);

const internalApiAddress = `http://localhost:${config.internal.port}`;
const externalApiAddress = `http://localhost:${config.public.port}`;

const delay = util.promisify(setTimeout);
const DELAY_TIME = 10;

const testSandbox = sinon.createSandbox();

describe('Internal: delete proband data', () => {
  before(async () => {
    await Server.init();
  });

  after(async () => {
    await Server.stop();
  });

  beforeEach(async () => {
    await setup();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('DELETE /user/users/{username}', () => {
    let authClientUsersMock: SinonStubbedInstance<Users>;

    beforeEach(() => {
      authClientUsersMock = testSandbox.stub(probandAuthClient.users);
      authClientUsersMock.find.resolves([
        { username: 'qtest-proband1', id: '1234' },
        { username: 'qtest-deleteme_fully', id: '4321' },
        { username: 'qtest-deleteme', id: '9876' },
      ]);
      authClientUsersMock.del.resolves();

      testSandbox.stub(MailService, 'sendMail').resolves(true);
    });

    afterEach(() => {
      testSandbox.restore();
    });

    it('should return 404 error if proband was not found', async () => {
      // Arrange
      const pseudoynm = 'DoesNotExist';

      // Act
      const res = await chai
        .request(internalApiAddress)
        .delete('/user/users/' + pseudoynm);

      // Assert
      expect(res).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should delete the proband and its data', async function () {
      // Arrange
      const pseudonym = 'qtest-proband1';

      // Act
      const res = await chai
        .request(internalApiAddress)
        .delete('/user/users/' + pseudonym);

      const proband: { status: ProbandStatus } = await db.one(
        "SELECT status FROM probands WHERE pseudonym = 'qtest-proband1'"
      );

      // Assert
      expect(res).to.have.status(StatusCodes.NO_CONTENT);
      expect(proband.status).to.equal('deleted');

      expect(authClientUsersMock.del).to.be.calledOnceWith({
        id: '1234',
        realm: 'pia-proband-realm',
      });

      expect(
        await db.manyOrNone(
          "SELECT * FROM lab_results WHERE id = 'APISAMPLE_11111'"
        )
      ).to.be.empty;
      expect(
        await db.manyOrNone(
          "SELECT * FROM questionnaire_instances WHERE user_id = 'qtest-proband1'"
        )
      ).to.be.empty;
    });

    it('should fully delete the proband from the database', async () => {
      // Arrange
      const pseudonym = 'qtest-deleteme_fully';

      // Act
      const result = await chai
        .request(internalApiAddress)
        .delete(`/user/users/${pseudonym}?full=true`);

      const proband = (await db.oneOrNone(
        "SELECT * FROM probands WHERE pseudonym='qtest-deleteme_fully'"
      )) as unknown;

      // Assert
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      expect(proband).to.be.null;

      expect(authClientUsersMock.del).to.be.calledOnceWith({
        id: '4321',
        realm: 'pia-proband-realm',
      });
    });

    it('should send the "proband.deleted" message', async () => {
      // Arrange
      let pseudonym: string | undefined;
      let deletionType: ProbandDeletionType | undefined;
      await messageQueueService.createConsumer(
        MessageQueueTopic.PROBAND_DELETED,
        async (message: {
          pseudonym: string;
          deletionType: ProbandDeletionType;
        }) => {
          pseudonym = message.pseudonym;
          deletionType = message.deletionType;
          return Promise.resolve();
        }
      );

      // Act
      const result = await chai
        .request(internalApiAddress)
        .delete('/user/users/qtest-deleteme');

      // Assert
      expect(result).to.have.status(StatusCodes.NO_CONTENT);

      while (pseudonym !== 'qtest-deleteme') {
        await delay(DELAY_TIME);
      }
      expect(pseudonym).to.equal('qtest-deleteme');
      expect(deletionType).to.equal('default');

      expect(authClientUsersMock.del).to.be.calledOnceWith({
        id: '9876',
        realm: 'pia-proband-realm',
      });
    });

    it('should not delete proband and its data from the external interface', async function () {
      // Arrange
      const pseudonym = 'qtest-proband1';

      // Act
      const res = await chai
        .request(externalApiAddress)
        .delete('/admin/users/' + pseudonym);

      // Assert
      expect(res).to.have.status(StatusCodes.UNAUTHORIZED);
    });
  });
});
