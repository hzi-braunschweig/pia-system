const Joi = require('joi');

const questionnairesHandler = require('../handlers/questionnairesHandler.js');

module.exports = {
  path: '/questionnaire/questionnaires/{id}/{version}',
  method: 'GET',
  handler: questionnairesHandler.getOne,
  config: {
    description: 'get the questionnaire with the specified id and version',
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
