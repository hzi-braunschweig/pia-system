const Joi = require('joi');

const complianceHandler = require('../handlers/complianceHandler.js');

module.exports = {
  path: '/compliance/{study}/agree/{userId}',
  method: 'GET',
  handler: complianceHandler.getComplianceAgree,
  config: {
    description: 'fetches compliance agreement',
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
