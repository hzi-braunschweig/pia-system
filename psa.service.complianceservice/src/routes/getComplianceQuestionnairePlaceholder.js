const Joi = require('joi');

const compliancePlaceholderHandler = require('../handlers/compliancePlaceholderHandler');

module.exports = {
  path: '/compliance/{study}/questionnaire-placeholder',
  method: 'GET',
  handler: compliancePlaceholderHandler.getComplianceQuestionnairePlaceholders,
  config: {
    description: 'fetches compliance placeholders for questionnaire',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study: Joi.string().description('the name of the study').required(),
      }).unknown(),
    },
  },
};
