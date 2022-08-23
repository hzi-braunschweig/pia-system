/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { UsersHandler } from '../../handlers/usersHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/admin/users/{pseudonym}',
  method: 'PATCH',
  handler: UsersHandler.updateOne,
  options: {
    description: 'updates proband data',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Untersuchungsteam',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the pseudonym of the user')
          .lowercase()
          .required()
          .default('Testproband1'),
      }).unknown(),
      payload: Joi.object({
        is_test_proband: Joi.boolean()
          .optional()
          .description('the proband is a test proband'),
      }).unknown(false),
    },
  },
};

export default route;
