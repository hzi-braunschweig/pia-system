const Joi = require('joi');
const internalUsersHandler = require('../../handlers/internal/internalUsersHandler');

module.exports = {
  path: '/user/professional/{username}/allProbands',
  method: 'GET',
  handler: internalUsersHandler.getProbandsWithAcessToFromProfessional,
  config: {
    description:
      'gets all the probands a user with a professional role has access to',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the username of the user with the professional role')
          .required(),
      }).unknown(),
    },
  },
};
