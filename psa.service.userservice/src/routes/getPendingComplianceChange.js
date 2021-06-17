const Joi = require('joi');

const pendingComplianceChangesHandler = require('../handlers/pendingComplianceChangesHandler.js');

module.exports = {
  path: '/user/pendingcompliancechanges/{id}',
  method: 'GET',
  handler: pendingComplianceChangesHandler.getOne,
  config: {
    description: 'get a pending pending compliance change',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description('the id of the pending compliance change to get')
          .required(),
      }).unknown(),
    },
  },
};
