/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { ProbandsHandler } from '../handlers/probandsHandler';

// This route is only used by NatCoEdc
const route: ServerRoute = {
  path: '/user/probands',
  method: 'POST',
  handler: ProbandsHandler.createProbandFromExternal,
  options: {
    description: 'creates a proband from external or internal system',
    auth: undefined,
    tags: ['api'],
    validate: {
      payload: Joi.object({
        apiKey: Joi.string().required().description('a valid api key'),
        ut_email: Joi.string()
          .required()
          .description('the email/username of the requesting ut'),
        pseudonym: Joi.string()
          .required()
          .description(
            'the l3 pseudonym, can be the same as ids as well to support probands without pseudonym'
          ),
        complianceLabresults: Joi.bool()
          .required()
          .description('compliance to see lab results'),
        complianceSamples: Joi.bool()
          .required()
          .description('compliance to take nasal swaps'),
        complianceBloodsamples: Joi.bool()
          .required()
          .description('compliance to take blood samples'),
        studyCenter: Joi.string()
          .required()
          .description('the associated study center'),
        examinationWave: Joi.number()
          .required()
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
