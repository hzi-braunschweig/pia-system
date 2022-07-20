/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { UsersHandler } from '../../handlers/usersHandler';
import { config } from '../../config';

const route: ServerRoute = {
  path: '/admin/users',
  method: 'POST',
  handler: UsersHandler.createOne,
  options: {
    description: 'creates a user',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:SysAdmin',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        // on development system it is possible to specify that
        // a password is not temporary.
        // This is especially helpfull for e2e tests.
        ...(config.isDevelopmentSystem
          ? {
              temporaryPassword: Joi.bool().default(true),
            }
          : {}),
        username: Joi.string()
          .required()
          .lowercase()
          .email()
          .default('forscher@example.com'),
        role: Joi.string()
          .required()
          .valid(
            'Forscher',
            'ProbandenManager',
            'EinwilligungsManager',
            'Untersuchungsteam'
          ),
        study_accesses: Joi.array()
          .required()
          .items({
            study_id: Joi.string()
              .description('a name of a study the user should be assigned to')
              .default('Examplestudy'),
            access_level: Joi.string()
              .required()
              .default('read')
              .valid('read', 'write', 'admin'),
          })
          .min(0),
      }).unknown(),
    },
  },
};

export default route;
