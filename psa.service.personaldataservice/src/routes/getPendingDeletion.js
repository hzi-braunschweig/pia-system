const Joi = require('joi');

const pendingDeletionsHandler = require('../handlers/pendingDeletionsHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/personal/pendingdeletions/{proband_id}',
  method: 'GET',
  handler: pendingDeletionsHandler.getOne,
  options: {
    description: 'get a pending deletion',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        proband_id: Joi.string()
          .description('the id of the proband for deletion to get')
          .required(),
      }).unknown(),
    },
  },
};
