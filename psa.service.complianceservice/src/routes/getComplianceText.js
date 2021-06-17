const Joi = require('joi');

const complianceTextHandler = require('../handlers/complianceTextHandler');

module.exports = {
  path: '/compliance/{study}/text',
  method: 'GET',
  handler: complianceTextHandler.getComplianceText,
  config: {
    description: 'fetches the compliance text',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study: Joi.string().description('the name of the study').required(),
      }).unknown(),
    },
  },
};
