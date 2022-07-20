/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { PendingDeletionsHandler } from '../../handlers/pendingDeletionsHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/admin/pendingdeletions/{pseudonym}',
  method: 'GET',
  handler: PendingDeletionsHandler.getOne,
  options: {
    description: 'get a pending deletion',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:ProbandenManager',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the id of the proband for deletion to get')
          .lowercase()
          .required(),
      }).unknown(),
    },
  },
};

export default route;
