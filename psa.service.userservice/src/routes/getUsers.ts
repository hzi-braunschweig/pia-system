/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { UsersHandler } from '../handlers/usersHandler';

const route: ServerRoute = {
  path: '/user/users',
  method: 'GET',
  handler: UsersHandler.getAll,
  options: {
    description: 'get all users the requester has access to',
    auth: 'jwt',
    tags: ['api'],
  },
};

export default route;
