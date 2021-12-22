/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import * as changePasswordHandler from '../handlers/changePasswordHandler';
import { ServerRoute } from '@hapi/hapi';
import { config } from '../config';

const route: ServerRoute = {
  path: '/user/changePassword',
  method: 'POST',
  handler: changePasswordHandler.changePassword,
  options: {
    description: 'Change password',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        oldPassword: Joi.string()
          .max(config.maxUserPasswordLength)
          .required()
          .allow(''),
        newPassword1: Joi.string()
          .min(config.minUserPasswordLength)
          .max(config.maxUserPasswordLength)
          .default('aaaaaAAAAA1!')
          .required()
          .regex(/.*[0-9].*/)
          .regex(/.*[a-z].*/)
          .regex(/.*[A-Z].*/)
          .regex(/.*[!#$%&()*+,-./:;<=>?@_{|}~\s].*/)
          .allow(''),
        newPassword2: Joi.string()
          .min(config.minUserPasswordLength)
          .max(config.maxUserPasswordLength)
          .default('aaaaaAAAAA1!')
          .required()
          .regex(/.*[0-9].*/)
          .regex(/.*[a-z].*/)
          .regex(/.*[A-Z].*/)
          .regex(/.*[!#$%&()*+,\-./:;<=>?@_{|}~\s].*/)
          .allow(''),
        username: Joi.string().optional(), // This field is deprecated and not used, but kept for backwards compatibility, because a user can only change his own password
      }).unknown(),
    },
  },
};

export default route;
