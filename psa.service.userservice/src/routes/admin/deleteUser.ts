/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { UsersHandler } from '../../handlers/usersHandler';

const route: ServerRoute = {
  path: '/admin/users/{username}',
  method: 'DELETE',
  handler: UsersHandler.deleteOne,
  options: {
    description: 'deletes a user and all its data',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:SysAdmin',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the username of the user to delete')
          .lowercase()
          .required(),
      }).unknown(),
    },
  },
};

export default route;
