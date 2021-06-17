const Joi = require('joi');

const pendingDeletionsHandler = require('../handlers/pendingDeletionsHandler.js');

module.exports = {
  path: '/user/pendingdeletions/{id}',
  method: 'PUT',
  handler: pendingDeletionsHandler.updateOne,
  config: {
    description: 'confirms a deletion request',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description('the id of the pending deletion to confirm')
          .required(),
      }).unknown(),
    },
  },
};
