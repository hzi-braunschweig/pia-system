/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const internalPersonalDataHandler = require('../../handlers/internal/internalPersonalDataHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/personal/personalData/proband/{username}',
  method: 'DELETE',
  handler: internalPersonalDataHandler.deleteOne,
  options: {
    description: 'delete the personal data of the given proband',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the probands username to delete data for')
          .required(),
      }).unknown(),
    },
    response: {
      schema: false,
    },
  },
};
