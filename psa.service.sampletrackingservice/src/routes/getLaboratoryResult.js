/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const laboratoryResultsHandler = require('../handlers/laboratoryResultsHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/sample/probands/{user_id}/labResults/{result_id}',
  method: 'GET',
  handler: laboratoryResultsHandler.getOneResult,
  options: {
    description: 'returns single laboratory result',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        user_id: Joi.string()
          .description('the username of the proband')
          .required(),
        result_id: Joi.string()
          .uppercase()
          .description('the id of the labresult')
          .required(),
      }).unknown(),
    },
  },
};
