/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { UsersHandler } from '../handlers/usersHandler';

const route: ServerRoute = {
  path: '/user/users/{pseudonym}',
  method: 'GET',
  handler: UsersHandler.getOne,
  options: {
    description: 'get a proband',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the pseudonym of the proband')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
