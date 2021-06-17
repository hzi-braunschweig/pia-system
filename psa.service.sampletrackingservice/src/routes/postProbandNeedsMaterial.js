const Joi = require('joi');

const materialHandler = require('../handlers/materialHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/sample/probands/{username}/needsMaterial',
  method: 'POST',
  handler: materialHandler.requestNewMaterial,
  options: {
    description: 'Creates request for material',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the id of the user who needs new material')
          .required(),
      }).unknown(),
    },
  },
};
