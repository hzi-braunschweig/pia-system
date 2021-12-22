/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import pendingPartialDeletionsHandler from '../handlers/pendingPartialDeletionsHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/user/pendingpartialdeletions/{id}',
  method: 'DELETE',
  handler: pendingPartialDeletionsHandler.deleteOne,
  options: {
    description: 'cancels a pending partial deletion',
    auth: 'jwt',
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
