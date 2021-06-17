const Joi = require('joi');

const pendingPartialDeletionsHandler = require('../handlers/pendingPartialDeletionsHandler.js');

module.exports = {
  path: '/user/pendingpartialdeletions/{id}',
  method: 'PUT',
  handler: pendingPartialDeletionsHandler.updateOne,
  config: {
    description: 'confirms a partial deletion request',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description('the id of the pending partial deletion to confirm')
          .required(),
      }).unknown(),
    },
  },
};
