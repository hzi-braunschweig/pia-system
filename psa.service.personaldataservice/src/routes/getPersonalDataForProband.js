const Joi = require('joi');

const personalDataHandler = require('../handlers/personalDataHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/personal/personalData/proband/{pseudonym}',
  method: 'GET',
  handler: personalDataHandler.getOne,
  options: {
    description: 'get the personal data for the given proband',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the probands pseudonym to get data for')
          .required(),
      }).unknown(),
    },
  },
};
