const Joi = require('joi');

const complianceTextHandler = require('../handlers/complianceTextHandler');

module.exports = {
  path: '/compliance/{study}/text/edit',
  method: 'GET',
  handler: complianceTextHandler.getComplianceTextEdit,
  config: {
    description:
      'fetches the compliance text with additional information for editing',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study: Joi.string().description('the name of the study').required(),
      }).unknown(),
    },
  },
};
