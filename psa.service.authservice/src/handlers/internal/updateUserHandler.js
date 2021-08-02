/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const pgHelper = require('../../services/postgresqlHelper.js');
const pwHashesHelper = require('../../helpers/pwHashesHelper.js');
const Boom = require('@hapi/boom');

class CreateUserHandler {
  static async updateUser(request) {
    const payload = request.payload;

    try {
      const user = {
        username: payload.username,
        role: payload.role,
        initial_password_validity_date: payload.initial_password_validity_date,
        pw_change_needed: payload.pw_change_needed,
        account_status: payload.account_status,
        new_username: payload.new_username,
      };
      if (payload.password) {
        const { passwordHash, salt } =
          pwHashesHelper.createHashedPasswordWithSaltAndPepper(
            payload.password
          );

        user.password = passwordHash;
        user.salt = salt;
      }

      return await pgHelper.updateUser(user);
    } catch (error) {
      console.error(error);
      return Boom.internal('Failed to update user');
    }
  }
}

module.exports = CreateUserHandler;
