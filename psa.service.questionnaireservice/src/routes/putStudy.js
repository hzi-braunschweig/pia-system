const Joi = require('joi');

const studiesHandler = require('../handlers/studiesHandler.js');

module.exports = {
  path: '/questionnaire/studies/{name}',
  method: 'PUT',
  handler: studiesHandler.updateOne,
  config: {
    description:
      'changes the study with the specified name if the user has access',
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
        name: Joi.string()
          .description('the changed name of the study')
          .required()
          .default('NeueTeststudieGeändert'),
        description: Joi.string()
          .description('the changed description of the study')
          .required()
          .default('Beschreibung der neuen teststudie geändert'),
        pm_email: Joi.string()
          .description('the changed central email address of PM')
          .required()
          .allow(null)
          .email()
          .default('pm@pia.de'),
        hub_email: Joi.string()
          .description('central email address of hub lab')
          .required()
          .allow(null)
          .email()
          .default('hub@pia.de'),
      }).unknown(),
    },
  },
};
