/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import pendingComplianceChangesHandler from '../handlers/pendingComplianceChangesHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/user/pendingcompliancechanges/{id}',
  method: 'DELETE',
  handler: pendingComplianceChangesHandler.deleteOne,
  options: {
    description: 'cancels a pending compliance change',
    auth: 'jwt',
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
