/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { UsersHandler } from '../handlers/usersHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/user/usersWithSameRole',
  method: 'GET',
  handler: UsersHandler.getAllWithSameRole,
  options: {
    description: 'get all users with the same role as a requester',
    auth: 'jwt',
    tags: ['api'],
  },
};

export default route;
