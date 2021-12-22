/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { UsersHandler } from '../handlers/usersHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/user/users/{username}',
  method: 'PATCH',
  handler: UsersHandler.updateOne,
  options: {
    description: 'updates user data',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the name of the user')
          .required()
          .default('Testproband1'),
      }).unknown(),
      payload: Joi.object({
        is_test_proband: Joi.boolean()
          .optional()
          .description('the user is a test proband'),
      }).unknown(false),
    },
  },
};

export default route;
