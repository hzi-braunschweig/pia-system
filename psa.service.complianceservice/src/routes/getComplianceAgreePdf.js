const Joi = require('joi');

const complianceHandler = require('../handlers/complianceHandler.js');

module.exports = {
  path: '/compliance/{study}/agree-pdf/{userId}',
  method: 'GET',
  handler: complianceHandler.getComplianceAgreePdf,
  config: {
    description: 'fetches compliance agreement as pdf',
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
