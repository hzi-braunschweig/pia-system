/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as util from 'util';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';

import { db } from '../../src/db';

import { Server } from '../../src/server';
import { messageQueueService } from '../../src/services/messageQueueService';
import { StatusCodes } from 'http-status-codes';
import {
  cleanup,
  setup,
} from './internal-deleteProbandData.spec.data/setup.helper';
import { config } from '../../src/config';
import { ProbandDeletionType } from '../../src/services/probandService';
import { ProbandStatus } from '../../src/models/probandStatus';

chai.use(chaiHttp);

const internalApiAddress = `http://localhost:${config.internal.port}`;
const externalApiAddress = `http://localhost:${config.public.port}`;

const delay = util.promisify(setTimeout);
const DELAY_TIME = 10;

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
      const pseudonym = 'QTestProband1';

      // Act
      const res = await chai
        .request(internalApiAddress)
        .delete('/user/users/' + pseudonym);

      const proband: { status: ProbandStatus } = await db.one(
        "SELECT status FROM probands WHERE pseudonym = 'QTestProband1'"
      );
      const account = (await db.oneOrNone(
        "SELECT * FROM accounts WHERE username = 'QTestProband1'"
      )) as unknown;

      // Assert
      expect(res).to.have.status(StatusCodes.NO_CONTENT);
      expect(proband.status).to.equal('deleted');
      expect(account).to.be.null;

      expect(
        await db.manyOrNone(
          "SELECT * FROM lab_results WHERE id = 'APISAMPLE_11111'"
        )
      ).to.be.empty;
      expect(
        await db.manyOrNone(
          "SELECT * FROM questionnaire_instances WHERE user_id = 'QTestProband1'"
        )
      ).to.be.empty;
    });

    it('should fully delete the proband from the database', async () => {
      // Arrange
      const pseudonym = 'DeleteMeFully';

      // Act
      const result = await chai
        .request(internalApiAddress)
        .delete(`/user/users/${pseudonym}?full=true`);

      const proband = (await db.oneOrNone(
        "SELECT * FROM probands WHERE pseudonym='DeleteMeFully'"
      )) as unknown;

      const account: null = await db.oneOrNone(
        "SELECT * FROM accounts WHERE username='DeleteMeFully'"
      );

      // Assert
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      expect(account).to.be.null;
      expect(proband).to.be.null;
    });

    it('should send the "proband.deleted" message', async () => {
      // Arrange
      let pseudonym: string | undefined;
      let deletionType: ProbandDeletionType | undefined;
      await messageQueueService.createConsumer(
        'proband.deleted',
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
        .delete('/user/users/DeleteMe');

      // Assert
      expect(result).to.have.status(StatusCodes.NO_CONTENT);

      while (pseudonym !== 'DeleteMe') {
        await delay(DELAY_TIME);
      }
      expect(pseudonym).to.equal('DeleteMe');
      expect(deletionType).to.equal('default');
    });

    it('should not delete proband and its data from the external interface', async function () {
      // Arrange
      const pseudonym = 'QTestProband1';

      // Act
      const res = await chai
        .request(externalApiAddress)
        .delete('/user/users/' + pseudonym);

      // Assert
      expect(res).to.have.status(StatusCodes.UNAUTHORIZED);
    });
  });
});
