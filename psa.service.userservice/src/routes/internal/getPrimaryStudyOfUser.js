/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');
const internalUsersHandler = require('../../handlers/internal/internalUsersHandler');

module.exports = {
  path: '/user/users/{username}/primaryStudy',
  method: 'GET',
  handler: internalUsersHandler.getPrimaryStudy,
  config: {
    description: 'looks up the primary study of a user',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the username of the user to query')
          .required(),
      }).unknown(),
    },
  },
};
