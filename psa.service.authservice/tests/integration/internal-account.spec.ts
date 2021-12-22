/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chaiHttp from 'chai-http';
import chai, { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import { config } from '../../src/config';
import { CreateAccountRequest } from '../../src/models/account';
import { Server } from '../../src/server';
import { getRepository, Repository } from 'typeorm';
import { Account } from '../../src/entities/account';

import { cleanup, setup } from './internal-account.spec.data/setup.helper';

chai.use(chaiHttp);
const apiAddress = `http://localhost:${config.internal.port}`;

const SECONDS_OF_PASSWORD_VALIDITY = 86400;

describe('Internal: /auth/user', () => {
  let userRepo: Repository<Account>;
  before(async () => {
    await setup();
    await Server.init();
    userRepo = getRepository(Account);
  });
  after(async () => {
    await Server.stop();
    await cleanup();
  });
  afterEach(async () => {
    await userRepo.delete(['QTestPm', 'QTestProband1']);
  });

  describe('POST /auth/user', () => {
    it('should create an account for a professional user', async () => {
      // Arrange
      const createAccountRequest: CreateAccountRequest = {
        username: 'QTestPm',
        role: 'ProbandenManager',
        password: 'test-password',
        pwChangeNeeded: true,
      };

      // Act
      const result = await chai
        .request(apiAddress)
        .post('/auth/user')
        .send(createAccountRequest);

      // Assert
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      const user = await userRepo.findOne(createAccountRequest.username);
      expect(user).to.be.an('object');
      expect(user?.password).to.be.a('string');
      expect(user?.password).to.not.equal('');
      expect(user?.password).to.not.equal(createAccountRequest.password);
    });

    it('should create an account for a proband', async () => {
      // Arrange

      // Act
      const createAccountRequest: CreateAccountRequest = {
        username: 'QTestProband1',
        role: 'Proband',
        password: 'test-password',
        pwChangeNeeded: true,
        initialPasswordValidityDate: new Date(
          Date.now() + SECONDS_OF_PASSWORD_VALIDITY
        ),
      };

      // Assert
      const result = await chai
        .request(apiAddress)
        .post('/auth/user')
        .send(createAccountRequest);
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      const user = await userRepo.findOne(createAccountRequest.username);
      expect(user).to.be.an('object');
      expect(user?.password).to.be.a('string');
      expect(user?.password).to.not.equal('');
      expect(user?.password).to.not.equal(createAccountRequest.password);
    });
  });

  describe('DELETE /auth/user/{username}', () => {
    beforeEach(async () => {
      await userRepo.insert([
        {
          username: 'QTestPm',
          role: 'ProbandenManager',
          password: 'passwordHash',
          salt: 'salt',
          pwChangeNeeded: false,
        },
        {
          username: 'QTestProband1',
          role: 'Proband',
          password: 'passwordHash',
          salt: 'salt',
          pwChangeNeeded: false,
        },
      ]);
    });

    it('should delete an account for a professional user', async () => {
      // Arrange
      const username = 'QTestPm';

      // Act
      const result = await chai
        .request(apiAddress)
        .delete('/auth/user/' + username);

      // Assert
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      const user = await userRepo.findOne(username);
      expect(user).to.be.undefined;
    });

    it('should delete an account of a proband', async () => {
      // Arrange
      const username = 'QTestProband1';

      // Act
      const result = await chai
        .request(apiAddress)
        .delete('/auth/user/' + username);

      // Assert
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      const user = await userRepo.findOne(username);
      expect(user).to.be.undefined;
    });

    it('should return 404 if user does not exist', async () => {
      // Arrange
      const username = 'QTestNotExisting';

      // Act
      const result = await chai
        .request(apiAddress)
        .delete('/auth/user/' + username);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });
  });
});
