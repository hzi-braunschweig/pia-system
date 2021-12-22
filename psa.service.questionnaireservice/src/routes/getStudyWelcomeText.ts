/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';

import { StudiesHandler } from '../handlers/studiesHandler';

module.exports = {
  path: '/questionnaire/studies/{name}/welcome-text',
  method: 'GET',
  handler: StudiesHandler.getStudyWelcomeText,
  config: {
    description: 'get the study welcome text if the user has access',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        name: Joi.string()
          .description('the name of the study')
          .required()
          .default('Teststudie1'),
      }).unknown(),
    },
  },
};
