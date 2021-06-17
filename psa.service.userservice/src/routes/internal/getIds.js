const Joi = require('joi');
const internalUsersHandler = require('../../handlers/internal/internalUsersHandler');

module.exports = {
  path: '/user/users/{username}/ids',
  method: 'GET',
  handler: internalUsersHandler.lookupIds,
  config: {
    description: 'looks up ids of user',
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
