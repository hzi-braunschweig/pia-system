/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import plannedProbandsHandler from '../handlers/plannedProbandsHandler';

const route: ServerRoute = {
  path: '/user/plannedprobands',
  method: 'GET',
  handler: plannedProbandsHandler.getAll,
  options: {
    description: 'get all planned probands',
    auth: 'jwt',
    tags: ['api'],
  },
};

export default route;
