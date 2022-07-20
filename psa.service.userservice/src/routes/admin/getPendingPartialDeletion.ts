/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { PendingPartialDeletionsHandler } from '../../handlers/pendingPartialDeletionsHandler';

const route: ServerRoute = {
  path: '/admin/pendingpartialdeletions/{id}',
  method: 'GET',
  handler: PendingPartialDeletionsHandler.getOne,
  options: {
    description: 'get a pending partialdeletion',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .description('the id of the pending partial deletion to get')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
