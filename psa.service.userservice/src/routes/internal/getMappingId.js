const Joi = require('joi');
const internalUsersHandler = require('../../handlers/internal/internalUsersHandler');

module.exports = {
  path: '/user/users/{username}/mappingId',
  method: 'GET',
  handler: internalUsersHandler.lookupMappingId,
  config: {
    description: 'looks up mappingId of user',
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
