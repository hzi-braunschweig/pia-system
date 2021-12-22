/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { InternalUsersHandler } from '../../handlers/internal/internalUsersHandler';

const route: ServerRoute = {
  path: '/user/studies/{studyName}/probands',
  method: 'POST',
  handler: InternalUsersHandler.postProband,
  options: {
    description: 'creates a new proband',
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string()
          .required()
          .description(
            'the name of the study the proband should be assigned to'
          ),
      }),
      payload: Joi.object({
        pseudonym: Joi.string()
          .required()
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
    },
  },
};

export default route;
