const Joi = require('joi');

const complianceHandler = require('../handlers/complianceHandler.js');

module.exports = {
  path: '/compliance/{study}/agree-pdf/instance/{id}',
  method: 'GET',
  handler: complianceHandler.getComplianceAgreePdfByComplianceId,
  config: {
    description: 'fetches compliance agreement as pdf',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study: Joi.string().description('the name of the study').required(),
        id: Joi.number().description('the id of the compliance').required(),
      }).unknown(),
    },
  },
};
