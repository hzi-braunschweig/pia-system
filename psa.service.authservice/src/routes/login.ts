/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import * as loginHandler from '../handlers/loginHandler';
import { config } from '../config';

const route: ServerRoute = {
  path: '/user/login',
  method: 'POST',
  handler: loginHandler.login,
  options: {
    description: 'Login',
    auth: {
      strategy: 'jwt_login',
      mode: 'optional',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        logged_in_with: Joi.string()
          .required()
          .default('web')
          .valid('web', 'ios', 'android'),
        password: Joi.string()
          .max(config.maxUserPasswordLength)
          .required()
          .allow(''),
        username: Joi.string().optional(),
        locale: Joi.string().optional(),
      }).unknown(),
    },
  },
};

export default route;
