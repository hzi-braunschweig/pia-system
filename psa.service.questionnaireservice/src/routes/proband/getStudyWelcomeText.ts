/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { StudiesHandler } from '../../handlers/studiesHandler';
import { studyParamsValidation } from '../studyRequestValidators';

const route: ServerRoute = {
  path: '/studies/{studyName}/welcome-text',
  method: 'GET',
  handler: StudiesHandler.getStudyWelcomeText,
  options: {
    description: 'get the study welcome text if the user has access',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: studyParamsValidation,
    },
  },
};

export default route;
