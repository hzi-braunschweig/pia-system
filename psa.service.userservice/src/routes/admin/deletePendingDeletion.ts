/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { PendingDeletionsHandler } from '../../handlers/pendingDeletionsHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/admin/pendingdeletions/{id}',
  method: 'DELETE',
  handler: PendingDeletionsHandler.deleteOne,
  options: {
    description: 'cancels a pending deletion',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:ProbandenManager', 'realm:SysAdmin'],
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .description('the pending deletions id to cancel')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
