/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const answersHandler = require('../handlers/answersHandler.js');

module.exports = {
  path: '/questionnaire/questionnaireInstances/{id}/answers',
  method: 'POST',
  handler: answersHandler.createOrUpdate,
  config: {
    payload: {
      parse: true,
      maxBytes: 100000000,
    },
    description: 'creates or updates answers for a questionnaire instance',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire instance')
          .required(),
      }).unknown(),
      payload: Joi.object({
        answers: Joi.array()
          .items({
            question_id: Joi.number().integer().required().default(1),
            answer_option_id: Joi.number().integer().required().default(1),
            value: Joi.string()
              .max(27962026) // ~20MB filesize based on the base64 encoding - https://en.wikipedia.org/wiki/Base64
              .allow('')
              .description('the answer value')
              .required()
              .default('Ja')
              .messages({
                'string.max': `answer value should have a maximum length of {#limit}`,
              }),
          })
          .min(0)
          .required(),
        date_of_release: Joi.string()
          .description('date of release answer')
          .optional()
          .allow(null),
        version: Joi.number().integer().optional().default(1),
      }).unknown(),
      failAction: (request, h, err) => err, // show detailed validation error
    },
  },
};
