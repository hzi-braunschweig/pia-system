const Joi = require('joi');

const studiesHandler = require('../handlers/studiesHandler.js');

module.exports = {
  path: '/questionnaire/studies/{name}',
  method: 'GET',
  handler: studiesHandler.getOne,
  config: {
    description:
      'get the studiy with the specified name if the user has access',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        name: Joi.string()
          .description('the name of the study')
          .required()
          .default('Teststudie1'),
      }).unknown(),
    },
  },
};
