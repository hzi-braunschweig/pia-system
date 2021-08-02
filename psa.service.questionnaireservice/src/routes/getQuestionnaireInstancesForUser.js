/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const questionnaireInstancesHandler = require('../handlers/questionnaireInstancesHandler.js');

module.exports = {
  path: '/questionnaire/user/{user_id}/questionnaireInstances',
  method: 'GET',
  handler: questionnaireInstancesHandler.getAllForUser,
  config: {
    description: 'get the questionnaire instances for given user',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        user_id: Joi.string()
          .description(
            'the user name of the user to get questionnaire instances for'
          )
          .required(),
      }).unknown(),
    },
  },
};
