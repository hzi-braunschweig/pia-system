/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { RouteOptionsValidate } from '@hapi/hapi';
import { config } from '../config';

export const postProbandValidation: RouteOptionsValidate = {
  params: Joi.object({
    studyName: Joi.string()
      .required()
      .description('the name of the study the proband should be assigned to'),
  }),
  payload: Joi.object({
    // on development system it is possible to specify that
    // a password is not temporary.
    // This is especially helpfull for e2e tests.
    ...(config.isDevelopmentSystem
      ? {
          temporaryPassword: Joi.bool().default(true),
        }
      : {}),
    pseudonym: Joi.string()
      .required()
      .lowercase()
      .description(
        'the pseudonym of planned probands that should be assigned to the proband'
      ),
    ids: Joi.string().optional().empty(null).description('an optional ids'),
    complianceLabresults: Joi.bool()
      .optional()
      .default(false)
      .description('compliance to see lab results'),
    complianceSamples: Joi.bool()
      .optional()
      .default(false)
      .description('compliance to take nasal swaps'),
    complianceBloodsamples: Joi.bool()
      .optional()
      .default(false)
      .description('compliance to take blood samples'),
    studyCenter: Joi.string()
      .optional()
      .empty(null)
      .description('the associated study center'),
    examinationWave: Joi.number()
      .optional()
      .empty(null)
      .description('the wave of examination'),
  })
    .rename('compliance_labresults', 'complianceLabresults')
    .rename('compliance_samples', 'complianceSamples')
    .rename('compliance_bloodsamples', 'complianceBloodsamples')
    .rename('study_center', 'studyCenter')
    .rename('examination_wave', 'examinationWave')
    .unknown(false),
};
