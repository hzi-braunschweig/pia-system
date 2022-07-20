/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { StudiesHandler } from '../../handlers/studiesHandler';

const route: ServerRoute = {
  path: '/admin/studies',
  method: 'GET',
  handler: StudiesHandler.getAll,
  options: {
    description: 'get all studies the user has access to',
    auth: {
      strategy: 'jwt-admin',
      scope: [
        'realm:Untersuchungsteam',
        'realm:Forscher',
        'realm:ProbandenManager',
        'realm:SysAdmin',
        'realm:EinwilligungsManager',
      ],
    },
    tags: ['api'],
  },
};

export default route;
