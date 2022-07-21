/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { StudiesHandler } from '../../handlers/studiesHandler';
import { studyParamsValidation } from '../studyRequestValidators';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}/welcome-text',
  method: 'PUT',
  handler: StudiesHandler.updateStudyWelcomeText,
  options: {
    description: 'changes the specified study welcome text',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: studyParamsValidation,
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

export default route;
