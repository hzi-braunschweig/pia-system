const Joi = require('joi');
const internalUsersHandler = require('../../handlers/internal/internalUsersHandler');

module.exports = {
  path: '/user/users/{username}',
  method: 'GET',
  handler: internalUsersHandler.getProband,
  config: {
    description: 'get a proband',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the username of the user to query')
          .required(),
      }).unknown(),
    },
  },
};
