const Joi = require('joi');

const complianceHandler = require('../handlers/complianceHandler.js');

module.exports = {
  path: '/compliance/{study}/agree/{userId}/needed',
  method: 'GET',
  handler: complianceHandler.getComplianceAgreeNeeded,
  config: {
    description: 'checks whether a new compliance agreement is needed',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study: Joi.string().description('the name of the study').required(),
        userId: Joi.string().description('the name of the user').required(),
      }).unknown(),
    },
  },
};
