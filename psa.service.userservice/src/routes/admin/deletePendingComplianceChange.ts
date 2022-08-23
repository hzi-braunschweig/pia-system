/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { PendingComplianceChangesHandler } from '../../handlers/pendingComplianceChangesHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/admin/pendingcompliancechanges/{id}',
  method: 'DELETE',
  handler: PendingComplianceChangesHandler.deleteOne,
  options: {
    description: 'cancels a pending compliance change',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:ProbandenManager',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .description('the pending compliance change id to cancel')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
