/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { ExampleHandler } from '../handlers/exampleHandler';

const route: ServerRoute = {
  path: '/example/{name}',
  method: 'GET',
  handler: ExampleHandler.getExample,
  options: {
    description: 'get example data',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
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
