const Joi = require('joi');

const pendingComplianceChangesHandler = require('../handlers/pendingComplianceChangesHandler.js');

module.exports = {
  path: '/user/pendingcompliancechanges/{id}',
  method: 'PUT',
  handler: pendingComplianceChangesHandler.updateOne,
  config: {
    description: 'confirms a pending compliance request',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description('the id of the pending compliance change to confirm')
          .required(),
      }).unknown(),
    },
  },
};
