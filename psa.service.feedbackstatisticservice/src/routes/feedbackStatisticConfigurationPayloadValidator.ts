/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';

export const feedbackStatisticConfigurationPayloadValidator = Joi.object({
  study: Joi.string().required(),
  visibility: Joi.string()
    .valid('hidden', 'testprobands', 'allaudiences')
    .required(),
  title: Joi.string().required(),
  description: Joi.string().allow('').required(),
  type: Joi.string().valid('relative_frequency_time_series').required(),

  comparativeValues: Joi.object({
    questionnaire: Joi.object({
      id: Joi.number().required(),
      version: Joi.number().required(),
    }).required(),
    answerOptionValueCodes: Joi.object({
      id: Joi.number().required(),
      variableName: Joi.string().allow('').allow(null).required(),
      valueCodes: Joi.array().items(Joi.number()).min(1).required(),
    }).required(),
  }).required(),

  timeSeries: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().optional(),
        color: Joi.string().required(),
        label: Joi.string().required(),
        questionnaire: Joi.object({
          id: Joi.number().required(),
          version: Joi.number().required(),
        }).required(),
        answerOptionValueCodes: Joi.object({
          id: Joi.number().required(),
          variableName: Joi.string().allow('').allow(null).required(),
          valueCodes: Joi.array().items(Joi.number()).min(1).required(),
        }).required(),
      })
    )
    .required(),

  intervalShift: Joi.object({
    amount: Joi.number().required(),
    unit: Joi.string().valid('hour', 'day', 'week', 'month').required(),
  }).required(),
  timeRange: Joi.object({
    startDate: Joi.string().isoDate().required(),
    endDate: Joi.string().isoDate().allow(null).required(),
  }).required(),
}).required();
