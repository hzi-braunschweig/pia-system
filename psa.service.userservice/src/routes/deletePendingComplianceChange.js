const Joi = require('joi');

const pendingComplianceChangesHandler = require('../handlers/pendingComplianceChangesHandler.js');

module.exports = {
  path: '/user/pendingcompliancechanges/{id}',
  method: 'DELETE',
  handler: pendingComplianceChangesHandler.deleteOne,
  config: {
    description: 'cancels a pending compliance change',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .description('the pending compliance change id to cancel')
          .required(),
      }).unknown(),
    },
  },
};
