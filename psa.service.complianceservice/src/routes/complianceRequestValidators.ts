/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { RouteOptionsValidate } from '@hapi/hapi';

export const complianceAgreeParamsValidator = Joi.object({
  studyName: Joi.string().description('the name of the study').required(),
  pseudonym: Joi.string()
    .description('the pseudonym of the proband')
    .lowercase()
    .required(),
}).unknown();

export const complianceAgreeValidator: RouteOptionsValidate = {
  params: complianceAgreeParamsValidator,
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
  failAction: (_request, _h, err) => err ?? new Error(), // show detailed validation error
};

export const complianceTextValidator: RouteOptionsValidate = {
  params: Joi.object({
    studyName: Joi.string().description('the name of the study').required(),
  }).unknown(),
};
