const Joi = require('joi');

const pendingDeletionsHandler = require('../handlers/pendingDeletionsHandler.js');

module.exports = {
  path: '/user/pendingdeletions/{id}',
  method: 'DELETE',
  handler: pendingDeletionsHandler.deleteOne,
  config: {
    description: 'cancels a pending deletion',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .description('the pending deletions id to cancel')
          .required(),
      }).unknown(),
    },
  },
};
