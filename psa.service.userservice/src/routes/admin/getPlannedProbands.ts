/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { PlannedProbandsHandler } from '../../handlers/plannedProbandsHandler';

const route: ServerRoute = {
  path: '/admin/plannedprobands',
  method: 'GET',
  handler: PlannedProbandsHandler.getAll,
  options: {
    description: 'get all planned probands',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Untersuchungsteam',
    },
    tags: ['api'],
  },
};

export default route;
