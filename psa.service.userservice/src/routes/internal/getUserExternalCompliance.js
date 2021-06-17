const Joi = require('joi');

const usersHandler = require('../../handlers/usersHandler.js');

module.exports = {
  path: '/user/users/{username}/externalcompliance',
  method: 'GET',
  handler: usersHandler.getUserExternalCompliance,
  config: {
    description: 'get a user',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the username of the user')
          .required(),
      }).unknown(),
    },
  },
};
