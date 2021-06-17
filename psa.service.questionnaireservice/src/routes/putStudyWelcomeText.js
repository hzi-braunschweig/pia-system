const Joi = require('joi');

const studiesHandler = require('../handlers/studiesHandler.js');

module.exports = {
  path: '/questionnaire/studies/{name}/welcome-text',
  method: 'PUT',
  handler: studiesHandler.updateStudyWelcomeText,
  config: {
    description: 'changes the specified study welcome text',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        name: Joi.string()
          .description('the name of the study')
          .required()
          .default('NeueTeststudie'),
      }).unknown(),
      payload: Joi.object({
        welcome_text: Joi.string()
          .description('the study welcome text')
          .allow('')
          .required(),
        language: Joi.string()
          .description('the language of the welcome text')
          .optional(),
      }).unknown(),
    },
  },
};
