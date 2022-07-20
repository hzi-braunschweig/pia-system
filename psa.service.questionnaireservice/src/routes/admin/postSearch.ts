/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { SearchesHandler } from '../../handlers/searchesHandler';

const route: ServerRoute = {
  path: '/admin/dataExport/searches',
  method: 'POST',
  handler: SearchesHandler.createOne,
  options: {
    description: 'creates a data search and returns the search results',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        start_date: Joi.date()
          .description('first date to get data for')
          .required()
          .allow(null),
        end_date: Joi.date()
          .description('last date to get data for')
          .required()
          .allow(null),
        study_name: Joi.string()
          .required()
          .description('the study name')
          .example('Teststudie1'),
        questionnaires: Joi.array()
          .items(
            Joi.number().integer().description('a questionnaire id').optional()
          )
          .required()
          .allow(null),
        probands: Joi.array()
          .items(
            Joi.string()
              .description('a proband username')
              .lowercase()
              .required()
              .default('Testproband1')
          )
          .min(1)
          .required(),
        exportAnswers: Joi.boolean()
          .description('do export answers')
          .required()
          .example(true),
        exportLabResults: Joi.boolean()
          .description('do export labresults')
          .required()
          .example(true),
        exportSamples: Joi.boolean()
          .description('do export sample ids for the probands')
          .required()
          .example(true),
        exportSettings: Joi.boolean()
          .description('do export user settings and compliances')
          .required()
          .example(true),
      }).unknown(false),
    },
  },
};

export default route;
