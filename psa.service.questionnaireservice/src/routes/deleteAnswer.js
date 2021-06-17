const Joi = require('joi');

const answersHandler = require('../handlers/answersHandler.js');

module.exports = {
  path: '/questionnaire/questionnaireInstances/{id}/answers/{answer_option_id}',
  method: 'DELETE',
  handler: answersHandler.deleteOne,
  config: {
    description: 'deletes an answer for a questionnaire instance',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire instance')
          .required(),
        answer_option_id: Joi.number()
          .integer()
          .description('the id of the answer option to delete the answer for')
          .required(),
      }).unknown(),
    },
  },
};
