/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { PendingPartialDeletionsHandler } from '../../handlers/pendingPartialDeletionsHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/admin/pendingpartialdeletions/{id}',
  method: 'DELETE',
  handler: PendingPartialDeletionsHandler.deleteOne,
  options: {
    description: 'cancels a pending partial deletion',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .description('the pending partial deletions id to cancel')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
