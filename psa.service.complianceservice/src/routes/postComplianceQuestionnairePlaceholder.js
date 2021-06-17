const Joi = require('joi');

const compliancePlaceholderHandler = require('../handlers/compliancePlaceholderHandler');

module.exports = {
  path: '/compliance/{study}/questionnaire-placeholder',
  method: 'POST',
  handler: compliancePlaceholderHandler.postComplianceQuestionnairePlaceholder,
  config: {
    description: 'creates a new placeholder for questionnaire compliances',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study: Joi.string().description('the name of the study').required(),
      }).unknown(),
      payload: Joi.object({
        type: Joi.string()
          .description('input field type')
          .valid('TEXT', 'RADIO')
          .required(),
        placeholder: Joi.string().description('field identifier').required(),
        label: Joi.string().description('input field label'),
      }),
    },
  },
};
