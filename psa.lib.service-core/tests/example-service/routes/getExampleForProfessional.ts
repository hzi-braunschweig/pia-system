/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { AdminExampleHandler } from '../handlers/admin/adminExampleHandler';

const route: ServerRoute = {
  path: '/admin/study/{studyName}/example/{name}',
  method: 'GET',
  handler: AdminExampleHandler.getExample,
  options: {
    description:
      'get example data for Forscher and Untersuchungsteam roles only',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:Forscher', 'realm:Untersuchungsteam', 'realm:SysAdmin'],
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string().description('the requested study').required(),
        name: Joi.string().description("the example's name").required(),
      }).unknown(),
    },
    response: {
      schema: Joi.object({
        name: Joi.string().description("the example's name"),
        age: Joi.number().description("the example's age"),
      }).unknown(),
    },
  },
};

export default route;
