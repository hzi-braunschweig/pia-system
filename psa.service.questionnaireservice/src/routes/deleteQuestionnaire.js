const Joi = require('joi');

const questionnairesHandler = require('../handlers/questionnairesHandler.js');

module.exports = {
  path: '/questionnaire/questionnaires/{id}/{version}',
  method: 'DELETE',
  handler: questionnairesHandler.deleteOne,
  config: {
    description: 'delete the questionnaire with the specified id',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire')
          .required(),
        version: Joi.number()
          .integer()
          .description('the version of the questionnaire')
          .required(),
      }).unknown(),
    },
  },
};
