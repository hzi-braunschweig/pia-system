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
  method: 'PUT',
  handler: pendingPartialDeletionsHandler.updateOne,
  options: {
    description: 'confirms a partial deletion request',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description('the id of the pending partial deletion to confirm')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
