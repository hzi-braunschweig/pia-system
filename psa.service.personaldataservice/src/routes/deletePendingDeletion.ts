/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { PendingDeletionsHandler } from '../handlers/pendingDeletionsHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/personal/pendingdeletions/{pseudonym}',
  method: 'DELETE',
  handler: PendingDeletionsHandler.deleteOne,
  options: {
    description: 'cancels a pending deletion',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the pseudonym for deletion to cancel')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
