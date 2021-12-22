/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import pendingPartialDeletionsHandler from '../handlers/pendingPartialDeletionsHandler';

const route: ServerRoute = {
  path: '/user/pendingpartialdeletions/{id}',
  method: 'GET',
  handler: pendingPartialDeletionsHandler.getOne,
  options: {
    description: 'get a pending partialdeletion',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description('the id of the pending partial deletion to get')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
