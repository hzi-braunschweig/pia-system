const Joi = require('joi');

const studyAccessesHandler = require('../handlers/studyAccessesHandler.js');

module.exports = {
  path: '/questionnaire/studies/{name}/accesses',
  method: 'GET',
  handler: studyAccessesHandler.getAll,
  config: {
    description: 'get all study accesses the user has access to',
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
