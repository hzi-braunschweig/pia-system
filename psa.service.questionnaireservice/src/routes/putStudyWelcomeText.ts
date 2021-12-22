/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';

import { StudiesHandler } from '../handlers/studiesHandler';

module.exports = {
  path: '/questionnaire/studies/{name}/welcome-text',
  method: 'PUT',
  handler: StudiesHandler.updateStudyWelcomeText,
  config: {
    description: 'changes the specified study welcome text',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        name: Joi.string()
          .description('the name of the study')
          .required()
          .default('NeueTeststudie'),
      }).unknown(),
      payload: Joi.object({
        welcome_text: Joi.string()
          .description('the study welcome text')
          .allow('')
          .required(),
        language: Joi.string()
          .description('the language of the welcome text')
          .optional(),
      }).unknown(),
    },
  },
};
