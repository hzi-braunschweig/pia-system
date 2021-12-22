/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { InternalUsersHandler } from '../../handlers/internal/internalUsersHandler';

const route: ServerRoute = {
  path: '/user/users/{username}/mappingId',
  method: 'GET',
  handler: InternalUsersHandler.lookupMappingId,
  options: {
    description: 'looks up mappingId of user',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the username of the user to query')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
