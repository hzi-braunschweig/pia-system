const Joi = require('joi');

const questionnaireInstancesHandler = require('../handlers/questionnaireInstancesHandler.js');

const validStatusForUser = [
  'active',
  'in_progress',
  'released_once',
  'released_twice',
];

module.exports = {
  path: '/questionnaire/questionnaireInstances',
  method: 'GET',
  handler: questionnaireInstancesHandler.getAll,
  config: {
    description: 'get all questionnaire instances the user has access to',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      query: Joi.object({
        status: Joi.array()
          .items(Joi.string().valid(...validStatusForUser))
          .default(validStatusForUser)
          .unique()
          .single(),
      }),
    },
  },
};
