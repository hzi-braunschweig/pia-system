/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { PendingDeletionsHandler } from '../../handlers/pendingDeletionsHandler';

const route: ServerRoute = {
  path: '/admin/pendingdeletions/{pseudonym}',
  method: 'DELETE',
  handler: PendingDeletionsHandler.deleteOne,
  options: {
    description: 'cancels a pending deletion',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:ProbandenManager',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the pseudonym for deletion to cancel')
          .lowercase()
          .required(),
      }).unknown(),
    },
  },
};

export default route;
