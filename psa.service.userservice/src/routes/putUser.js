/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const { UsersHandler } = require('../handlers/usersHandler');

module.exports = {
  path: '/user/users/{username}',
  method: 'PUT',
  handler: UsersHandler.updateOne,
  config: {
    description: 'updates user data',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the name of the user')
          .required()
          .default('Testproband1'),
      }).unknown(),
      payload: Joi.object({
        is_test_proband: Joi.boolean()
          .optional()
          .description('the user is a test proband'),
        account_status: Joi.string()
          .optional()
          .description('new account status')
          .valid('deactivated', 'deactivation_pending', 'active'),
      }).unknown(),
    },
  },
};
