/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const searchesHandler = require('../handlers/searchesHandler.js');

module.exports = {
  path: '/questionnaire/dataExport/searches',
  method: 'POST',
  handler: searchesHandler.createOne,
  config: {
    description: 'creates a data search and returns the search results',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        start_date: Joi.string()
          .description('first date to get data for')
          .required()
          .allow(null),
        end_date: Joi.string()
          .description('last date to get data for')
          .required()
          .allow(null),
        study_name: Joi.string()
          .required()
          .description('the study name')
          .default('Teststudie1'),
        questionnaires: Joi.array()
          .items(
            Joi.number().integer().description('a questionnaire id').optional()
          )
          .min(0)
          .required()
          .allow(null),
        probands: Joi.array()
          .items(
            Joi.string()
              .description('a proband username')
              .required()
              .default('Testproband1')
          )
          .min(1)
          .required(),
        exportAnswers: Joi.boolean()
          .description('do export answers')
          .required()
          .default(true),
        exportLabResults: Joi.boolean()
          .description('do export labresults')
          .required()
          .default(true),
        exportSamples: Joi.boolean()
          .description('do export sample ids for the probands')
          .required()
          .default(true),
        exportSettings: Joi.boolean()
          .description('do export user settings and compliances')
          .required()
          .default(true),
      }).unknown(),
    },
  },
};
