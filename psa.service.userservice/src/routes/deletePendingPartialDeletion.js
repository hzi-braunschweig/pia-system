const Joi = require('joi');

const pendingPartialDeletionsHandler = require('../handlers/pendingPartialDeletionsHandler.js');

module.exports = {
  path: '/user/pendingpartialdeletions/{id}',
  method: 'DELETE',
  handler: pendingPartialDeletionsHandler.deleteOne,
  config: {
    description: 'cancels a pending partial deletion',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .description('the pending partial deletions id to cancel')
          .required(),
      }).unknown(),
    },
  },
};
