/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const createUserHandler = require('../../handlers/internal/createUserHandler.js');

module.exports = {
  path: '/auth/user',
  method: 'POST',
  handler: createUserHandler.createUser,
  config: {
    description: 'creates a new user',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        username: Joi.string(),
        password: Joi.string(),
        role: Joi.string().valid(
          'Proband',
          'Forscher',
          'ProbandenManager',
          'EinwilligungsManager',
          'Untersuchungsteam'
        ),
        pw_change_needed: Joi.boolean(),
        initial_password_validity_date: Joi.date(),
        account_status: Joi.string().valid(
          'active',
          'deactivated',
          'deactivation_pending',
          'no_account'
        ),
      }).unknown(),
    },
  },
};
