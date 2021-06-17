const Joi = require('joi');

const pendingDeletionsHandler = require('../handlers/pendingDeletionsHandler.js');

module.exports = {
  path: '/user/pendingdeletions/{id}',
  method: 'GET',
  handler: pendingDeletionsHandler.getOne,
  config: {
    description: 'get a pending deletion',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description('the id of the pending deletion to get')
          .required(),
      }).unknown(),
    },
  },
};
