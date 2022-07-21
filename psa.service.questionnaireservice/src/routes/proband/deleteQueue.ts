/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { QueuesHandler } from '../../handlers/queuesHandler';

const route: ServerRoute = {
  path: '/probands/{pseudonym}/queues/{instanceId}',
  method: 'DELETE',
  handler: QueuesHandler.deleteOne,
  options: {
    description: 'deletes the queued instance if the proband has access',
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
        instanceId: Joi.string()
          .description('the id of the instance to remove from queue')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
