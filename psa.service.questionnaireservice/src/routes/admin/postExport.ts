/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { ExportHandler } from '../../handlers/exportHandler';
import { availableExportKeys } from '../../interactors/exports/availableExportFeatures';

const route: ServerRoute = {
  path: '/admin/export',
  method: 'POST',
  handler: ExportHandler.createOne,
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
            Joi.object({
              id: Joi.number()
                .integer()
                .description('questionnaire id')
                .required(),
              version: Joi.number()
                .integer()
                .description('questionnaire version')
                .required(),
            })
          )
          .required()
          .allow(null),
        probands: Joi.array()
          .items(
            Joi.string()
              .description('a proband username')
              .lowercase()
              .example('Testproband1')
          )
          .when('exports', {
            is: Joi.array().items(Joi.string().valid('codebook')),
            then: Joi.optional(),
            otherwise: Joi.array().min(1).required(),
          }),
        exports: Joi.array()
          .description('list of data to export')
          .required()
          .items(
            Joi.string()
              .description('an export key')
              .allow(...availableExportKeys)
              .lowercase()
              .required()
              .example('answers')
          )
          .example(availableExportKeys),
      }).unknown(false),
    },
  },
};

export default route;
