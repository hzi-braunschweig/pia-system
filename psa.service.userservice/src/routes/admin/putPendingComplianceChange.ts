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
  method: 'PUT',
  handler: PendingComplianceChangesHandler.updateOne,
  options: {
    description: 'confirms a pending compliance request',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:ProbandenManager',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description('the id of the pending compliance change to confirm')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
