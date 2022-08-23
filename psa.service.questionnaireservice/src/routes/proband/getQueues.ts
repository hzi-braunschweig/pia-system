/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { QueuesHandler } from '../../handlers/queuesHandler';
import Joi from 'joi';

const route: ServerRoute = {
  path: '/probands/{pseudonym}/queues',
  method: 'GET',
  handler: QueuesHandler.getAll,
  options: {
    description:
      'get all queued instances for the proband if the user has access',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the id of the user')
          .lowercase()
          .required(),
      }).unknown(),
    },
  },
};

export default route;
