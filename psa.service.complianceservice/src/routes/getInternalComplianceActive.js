const Joi = require('joi');

const complianceTextHandler = require('../handlers/complianceTextHandler');

module.exports = {
  path: '/compliance/{study}/active',
  method: 'GET',
  handler: complianceTextHandler.getInternalComplianceActive,
  config: {
    description:
      'checks whether the internal or external compliance is active for the given study',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study: Joi.string().description('the name of the study').required(),
      }).unknown(),
    },
  },
};
