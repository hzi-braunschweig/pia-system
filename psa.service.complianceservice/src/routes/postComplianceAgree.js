/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const complianceHandler = require('../handlers/complianceHandler.js');

module.exports = {
  path: '/compliance/{study}/agree/{userId}',
  method: 'POST',
  handler: complianceHandler.postComplianceAgree,
  config: {
    description: 'creates the compliance agreement for a user',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study: Joi.string().description('the name of the study').required(),
        userId: Joi.string().description('the name of the user').required(),
      }).unknown(),
      payload: Joi.object({
        compliance_text: Joi.string().required(),
        textfields: Joi.object({
          firstname: Joi.string(),
          lastname: Joi.string(),
          location: Joi.string(),
          birthdate: Joi.date(),
        }),
        compliance_system: Joi.object({
          app: Joi.boolean(),
          samples: Joi.boolean(),
          bloodsamples: Joi.boolean(),
          labresults: Joi.boolean(),
        }),
        compliance_questionnaire: Joi.array().items(
          Joi.object({
            name: Joi.string(),
            value: Joi.alternatives().try(Joi.string(), Joi.boolean()),
          })
        ),
      }),
      failAction: (request, h, err) => err, // show detailed validation error
    },
  },
};
