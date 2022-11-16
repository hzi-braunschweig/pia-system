/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { StudiesHandler } from '../../handlers/studiesHandler';
import { studyParamsValidation } from '../studyRequestValidators';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}/welcome-mail',
  method: 'GET',
  handler: StudiesHandler.getStudyWelcomeMail,
  options: {
    description: 'get the study welcome mail content',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: studyParamsValidation,
    },
  },
};

export default route;
