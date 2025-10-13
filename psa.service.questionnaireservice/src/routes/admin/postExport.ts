/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { ExportHandler } from '../../handlers/exportHandler';
import { availableExportKeys } from '../../interactors/exports/availableExportFeatures';
import { ExportOptions } from '../../interactors/exportInteractor';

const route: ServerRoute = {
  path: '/admin/export',
  method: 'POST',
  handler: ExportHandler.createOne,
  options: {
    description: 'exports the questionnaire answers for specific probands',
    tags: ['api'],
    auth: {
      strategies: ['payload'],
      payload: 'required',
    },
    validate: {
      payload: Joi.object({
        exportOptions: Joi.string()
          .required()
          .custom((value, helpers) => {
            let data: ExportOptions | undefined;
            try {
              if (typeof value !== 'string') {
                return helpers.error('any.invalid', {
                  message: 'ExportOptions must be a string',
                });
              }
              data = JSON.parse(value) as ExportOptions;
            } catch (e) {
              return helpers.error('any.invalid', {
                message: 'Request could not be parsed',
              });
            }

            const schema = Joi.object({
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
                  is: Joi.array().items(
                    Joi.string().valid('codebook'),
                    Joi.string().valid('questionnaires')
                  ),
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
            }).unknown(false);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { error, value: parsedValue } = schema.validate(
              data
            ) as Joi.ValidationResult<ExportOptions>;

            if (error) {
              return helpers.error('any.invalid', {
                message: `Request could not be parsed: ${error.details.toString()}`,
              });
            }

            return parsedValue;
          })
          .description('string encoded json containing the export options'),
        token: Joi.string().required().description('bearer token'),
      }),
    },
  },
};

export default route;
