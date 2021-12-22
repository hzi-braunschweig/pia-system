/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import * as changePasswordHandler from '../handlers/changePasswordHandler';

const route: ServerRoute = {
  path: '/user/newPassword',
  method: 'PUT',
  handler: changePasswordHandler.newPassword,
  options: {
    description: 'requests a new password for the user',
    auth: {
      strategy: 'jwt_login',
      mode: 'optional',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        user_id: Joi.string()
          .description('the login name of the user')
          .optional(),
      }).unknown(),
    },
  },
};

export default route;
