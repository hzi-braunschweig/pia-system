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
  method: 'PUT',
  handler: PendingDeletionsHandler.updateOne,
  options: {
    description: 'confirms a deletion request',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:ProbandenManager', 'realm:SysAdmin'],
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .description('the id of the pending deletion to confirm')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
