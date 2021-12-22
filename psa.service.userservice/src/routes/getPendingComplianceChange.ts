/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import pendingComplianceChangesHandler from '../handlers/pendingComplianceChangesHandler';

const route: ServerRoute = {
  path: '/user/pendingcompliancechanges/{id}',
  method: 'GET',
  handler: pendingComplianceChangesHandler.getOne,
  options: {
    description: 'get a pending pending compliance change',
    auth: 'jwt',
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
