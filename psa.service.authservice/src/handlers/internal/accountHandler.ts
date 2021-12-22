/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PwHashesHelper } from '../../helpers/pwHashesHelper';
import Boom from '@hapi/boom';
import { Lifecycle } from '@hapi/hapi';
import { Account } from '../../entities/account';
import { getRepository } from 'typeorm';
import { CreateAccountRequest } from '../../models/account';

export class AccountHandler {
  public static createAccount: Lifecycle.Method = async (request) => {
    const createUserRequest = request.payload as CreateAccountRequest;
    const repo = getRepository(Account);

    const { passwordHash, salt } =
      PwHashesHelper.createHashedPasswordWithSaltAndPepper(
        createUserRequest.password
      );

    const alreadyExisting = await repo.findOne(createUserRequest.username);
    if (alreadyExisting) {
      throw Boom.conflict('user already exists');
    }
    await repo
      .insert({
        username: createUserRequest.username,
        role: createUserRequest.role,
        password: passwordHash,
        salt: salt,
        pwChangeNeeded: createUserRequest.pwChangeNeeded,
        initialPasswordValidityDate:
          createUserRequest.initialPasswordValidityDate,
      })
      .catch((error) => {
        console.error(error);
        throw Boom.badImplementation('Failed to create user');
      });
    return null;
  };

  public static deleteAccount: Lifecycle.Method = async (request) => {
    const username = request.params['username'] as string;

    const repo = getRepository(Account);
    const user = await repo.findOne(username);

    if (!user) {
      throw Boom.notFound('User not found');
    }
    await repo.delete(user);
    return null;
  };
}
