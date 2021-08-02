/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const answertypesHandler = require('../handlers/answertypesHandler.js');

module.exports = {
  path: '/questionnaire/answertypes/{id}',
  method: 'GET',
  handler: answertypesHandler.getOne,
  config: {
    description: 'get the answertype with the specified id',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the answertype')
          .required(),
      }).unknown(),
    },
  },
};
