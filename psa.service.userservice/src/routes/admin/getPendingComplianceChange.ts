/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { PendingComplianceChangesHandler } from '../../handlers/pendingComplianceChangesHandler';

const route: ServerRoute = {
  path: '/admin/pendingcompliancechanges/{id}',
  method: 'GET',
  handler: PendingComplianceChangesHandler.getOne,
  options: {
    description: 'get a pending pending compliance change',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:ProbandenManager',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description('the id of the pending compliance change to get')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
