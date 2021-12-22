/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import util from 'util';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import { StatusCodes } from 'http-status-codes';
import { cleanup, setup } from './internal-patchProband.spec.data/setup.helper';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { ProbandStatusPatch } from '../../src/models/proband';
import { messageQueueService } from '../../src/services/messageQueueService';
import { ProbandStatus } from '../../src/models/probandStatus';

chai.use(chaiHttp);
chai.use(sinonChai);

const internalApiAddress = `http://localhost:${config.internal.port}`;

const delay = util.promisify(setTimeout);
const DELAY_TIME = 10;

describe('Internal: patch proband', function () {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  beforeEach(async function () {
    await setup();
  });

  afterEach(async function () {
    await cleanup();
  });

  describe('PATCH /user/users/{pseudonym}', function () {
    it('should return 404 if user does not exist', async function () {
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
        .patch('/user/users/QTestProband1')
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
        .patch('/user/users/QTestProband1')
        .send(body);

      // Assert
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
    });

    it('should send the "proband.deactivated" message', async function () {
      // Arrange
      const body: ProbandStatusPatch = { status: ProbandStatus.DEACTIVATED };
      let pseudonym: string | undefined;
      await messageQueueService.createConsumer(
        'proband.deactivated',
        async (message: { pseudonym: string }) => {
          pseudonym = message.pseudonym;
          return Promise.resolve();
        }
      );

      // Act
      await chai
        .request(internalApiAddress)
        .patch('/user/users/QTestProband1')
        .send(body);

      // Assert
      while (pseudonym !== 'QTestProband1') {
        await delay(DELAY_TIME);
      }
    });
  });
});
