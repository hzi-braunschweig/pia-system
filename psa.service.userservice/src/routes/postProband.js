/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const usersHandler = require('../handlers/usersHandler.js');

// This route is also used by NatCoEdc

module.exports = {
  path: '/user/probands',
  method: 'POST',
  handler: usersHandler.createProband,
  config: {
    description: 'creates a proband from external or internal system',
    auth: {
      strategy: 'jwt',
      mode: 'optional',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        apiKey: Joi.string().optional().description('a valid api key'),
        ut_email: Joi.string()
          .optional()
          .description('the email/username of the requesting ut'),
        pseudonym: Joi.string()
          .required()
          .description(
            'the l3 pseudonym, can be the same as ids as well to support probands without pseudonym'
          ),
        ids: Joi.string().optional().description('an optional ids'),
        compliance_labresults: Joi.bool()
          .required()
          .description('compliance to see lab results'),
        compliance_samples: Joi.bool()
          .required()
          .description('compliance to take nasal swaps'),
        compliance_bloodsamples: Joi.bool()
          .required()
          .description('compliance to take blood samples'),
        study_center: Joi.string()
          .required()
          .description('the associated study center'),
        examination_wave: Joi.number()
          .required()
          .description('the wave of examination'),
        study_accesses: Joi.array()
          .optional()
          .items(
            Joi.string()
              .description(
                'a name of a study the proband should be assigned to'
              )
              .required()
          )
          .min(0),
      }).unknown(),
    },
  },
};
