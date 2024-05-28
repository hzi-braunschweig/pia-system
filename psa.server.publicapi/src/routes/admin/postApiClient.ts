/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { ApiClientHandler } from '../../handlers/apiClientHandler';

const route: ServerRoute = {
  path: '/admin/clients',
  method: 'POST',
  handler: ApiClientHandler.postApiClient,
  options: {
    description: 'creates public api client',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:SysAdmin',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        name: Joi.string().description('the name of the client').required(),
        studies: Joi.array()
          .items(Joi.string())
          .description('the studies the client is allowed to access')
          .required(),
      }).required(),
    },
  },
};

export default route;
