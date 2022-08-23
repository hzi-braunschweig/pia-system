/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { StudiesHandler } from '../../handlers/studiesHandler';
import { studyPayloadValidation } from '../studyRequestValidators';

const route: ServerRoute = {
  path: '/admin/studies',
  method: 'POST',
  handler: StudiesHandler.createOne,
  options: {
    description: 'creates the study',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:SysAdmin',
    },
    tags: ['api'],
    validate: {
      payload: studyPayloadValidation,
    },
  },
};

export default route;
