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
