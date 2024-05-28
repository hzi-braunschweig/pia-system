/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { ApiClientHandler } from '../../handlers/apiClientHandler';

const route: ServerRoute = {
  path: '/admin/clients/{clientId}',
  method: 'DELETE',
  handler: ApiClientHandler.deleteApiClient,
  options: {
    description: 'deletes public api client',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:SysAdmin',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        clientId: Joi.string().description("the api client's ID").required(),
      }).required(),
    },
  },
};

export default route;
