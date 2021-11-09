/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { UsersHandler } from '../handlers/usersHandler';

const route: ServerRoute = {
  path: '/user/users',
  method: 'POST',
  handler: UsersHandler.createOne,
  options: {
    description: 'creates a user',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        username: Joi.string().required().email().default('NeuerTestProband'),
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
              .default('1'),
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
