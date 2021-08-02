/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const updateUserHandler = require('../../handlers/internal/updateUserHandler.js');

module.exports = {
  path: '/auth/user',
  method: 'PATCH',
  handler: updateUserHandler.updateUser,
  config: {
    description: 'updates a user',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().optional(),
        role: Joi.string()
          .optional()
          .valid(
            'Proband',
            'Forscher',
            'ProbandenManager',
            'EinwilligungsManager',
            'Untersuchungsteam'
          ),
        pw_change_needed: Joi.boolean().optional(),
        initial_password_validity_date: Joi.date().optional(),
        account_status: Joi.string()
          .valid('active', 'deactivated', 'deactivation_pending', 'no_account')
          .optional(),
      }).unknown(),
    },
  },
};
