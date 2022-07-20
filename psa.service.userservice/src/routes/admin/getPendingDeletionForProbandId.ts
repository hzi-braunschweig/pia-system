/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { PendingDeletionsHandler } from '../../handlers/pendingDeletionsHandler';

const route: ServerRoute = {
  path: '/admin/pendingdeletions/proband/{pseudonym}',
  method: 'GET',
  handler: PendingDeletionsHandler.getOneForProband,
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
          .description(
            'the pseudonym of the proband for pending deletion to get'
          )
          .lowercase()
          .required(),
      }).unknown(),
    },
  },
};

export default route;
