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
  path: '/admin/studies/{studyName}/welcome-mail',
  method: 'PUT',
  handler: StudiesHandler.updateStudyWelcomeMail,
  options: {
    description: 'updates the specified study welcome mail content',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: studyParamsValidation,
      payload: Joi.object({
        subject: Joi.string()
          .description('the welcome mail subject')
          .required(),
        markdownText: Joi.string()
          .description('the welcome mail content as markdown text')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
