/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { ConfigurationHandler } from '../../handlers/configurationHandler';

const route: ServerRoute = {
  path: '/admin/config',
  method: 'GET',
  handler: ConfigurationHandler.getConfig,
  options: {
    description: 'returns the event history configuration',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:SysAdmin',
    },
    tags: ['api'],
  },
};

export default route;
