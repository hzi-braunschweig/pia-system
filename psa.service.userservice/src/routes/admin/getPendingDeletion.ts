/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { PendingDeletionsHandler } from '../../handlers/pendingDeletionsHandler';

const route: ServerRoute = {
  path: '/admin/pendingdeletions/{id}',
  method: 'GET',
  handler: PendingDeletionsHandler.getOne,
  options: {
    description: 'get a pending deletion',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:ProbandenManager', 'realm:SysAdmin'],
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .description('the id of the pending deletion to get')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
