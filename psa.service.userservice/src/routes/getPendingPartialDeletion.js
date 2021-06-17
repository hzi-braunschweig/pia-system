const Joi = require('joi');

const pendingPartialDeletionsHandler = require('../handlers/pendingPartialDeletionsHandler.js');

module.exports = {
  path: '/user/pendingpartialdeletions/{id}',
  method: 'GET',
  handler: pendingPartialDeletionsHandler.getOne,
  config: {
    description: 'get a pending partialdeletion',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description('the id of the pending partial deletion to get')
          .required(),
      }).unknown(),
    },
  },
};
