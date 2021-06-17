const Joi = require('joi');

const laboratoryResultsHandler = require('../handlers/laboratoryResultsHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/sample/probands/{id}/labResults',
  method: 'GET',
  handler: laboratoryResultsHandler.getAllResults,
  options: {
    description: 'returns laboratory result list for proband',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string().description('the username of the proband').required(),
      }).unknown(),
    },
  },
};
