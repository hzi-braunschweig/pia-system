/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RouteOptionsValidate } from '@hapi/hapi';
import Joi from 'joi';

export const putLaboratoryResultRequestValidator: RouteOptionsValidate = {
  params: Joi.object({
    pseudonym: Joi.string()
      .description('the username of the proband')
      .lowercase()
      .required(),
    resultId: Joi.string()
      .uppercase()
      .description('the id of the lab result')
      .required(),
  }).unknown(),
  payload: Joi.object({
    remark: Joi.string()
      .allow('')
      .description('a free remark text the PM can save')
      .optional(),
    new_samples_sent: Joi.boolean()
      .description('true if new samples have been sent to the proband')
      .optional(),
    date_of_sampling: Joi.date()
      .description('the date when the proband created the sample')
      .optional(),
    dummy_sample_id: Joi.string()
      .uppercase()
      .description('a Bact-sample ID')
      .optional(),
    status: Joi.string()
      .valid('inactive', 'new')
      .description('status of the sample')
      .optional(),
  }),
};
