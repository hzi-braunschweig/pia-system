const Joi = require('joi');

const questionnaireInstancesHandler = require('../handlers/questionnaireInstancesHandler.js');

module.exports = {
  path: '/questionnaire/questionnaireInstances/{id}',
  method: 'GET',
  handler: questionnaireInstancesHandler.getOne,
  config: {
    description:
      'get the questionnaire instance with the specified id if the user has access',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire instance')
          .required(),
      }).unknown(),
    },
  },
};
