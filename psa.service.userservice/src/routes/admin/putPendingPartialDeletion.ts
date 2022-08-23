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
  method: 'PUT',
  handler: PendingPartialDeletionsHandler.updateOne,
  options: {
    description: 'confirms a partial deletion request',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .description('the id of the pending partial deletion to confirm')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
