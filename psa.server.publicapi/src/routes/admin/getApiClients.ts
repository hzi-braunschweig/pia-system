/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { ApiClientHandler } from '../../handlers/apiClientHandler';

const route: ServerRoute = {
  path: '/admin/clients',
  method: 'GET',
  handler: ApiClientHandler.getApiClients,
  options: {
    description: 'returns public api clients',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:SysAdmin',
    },
    tags: ['api'],
  },
};

export default route;
