/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';

import { StudiesHandler } from '../handlers/studiesHandler';

module.exports = {
  path: '/questionnaire/studies',
  method: 'POST',
  handler: StudiesHandler.createOne,
  config: {
    description: 'creates the study if the user has access',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        name: Joi.string()
          .description('the name of the study')
          .required()
          .default('NeueTeststudie'),
        description: Joi.string()
          .description('the description of the study')
          .required()
          .default('Beschreibung der neuen Teststudie'),
        pm_email: Joi.string()
          .description('central email address of PM')
          .required()
          .allow(null)
          .email()
          .default('pm@pia.de'),
        hub_email: Joi.string()
          .description('central email address of hub lab')
          .required()
          .allow(null)
          .email()
          .default('hub@pia.de'),
      }).unknown(),
    },
  },
};
