/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { StudiesHandler } from '../../handlers/studiesHandler';
import { studyParamsValidation } from '../studyRequestValidators';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}',
  method: 'GET',
  handler: StudiesHandler.getOne,
  options: {
    description: 'get the study with the specified name if the user has access',
    auth: {
      strategy: 'jwt-admin',
      scope: [
        'realm:Untersuchungsteam',
        'realm:EinwilligungsManager',
        'realm:ProbandenManager',
        'realm:Forscher',
        'realm:SysAdmin',
      ],
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: studyParamsValidation,
    },
  },
};

export default route;
