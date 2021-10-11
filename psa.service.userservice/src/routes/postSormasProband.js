/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const { UsersHandler } = require('../handlers/usersHandler');

module.exports = {
  path: '/user/sormasProbands',
  method: 'POST',
  handler: UsersHandler.createSormasProband,
  config: {
    description: 'creates a sormas proband',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        email: Joi.string()
          .required()
          .email()
          .description('the email of the new proband'),
        uuid: Joi.string().required().description('sormas uuid'),
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
          .required()
          .items(
            Joi.string()
              .description(
                'a name of a study the proband should be assigned to'
              )
              .required()
          )
          .min(1),
      }).unknown(),
      failAction: (request, h, err) => err,
    },
  },
};
