const Joi = require('joi');
const internalUsersHandler = require('../../handlers/internal/internalUsersHandler');

module.exports = {
  path: '/user/users/{username}/primaryStudy',
  method: 'GET',
  handler: internalUsersHandler.getPrimaryStudy,
  config: {
    description: 'looks up the primary study of a user',
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
