const Joi = require('joi');

const usersHandler = require('../handlers/usersHandler.js');

module.exports = {
  path: '/user/users/{username}',
  method: 'GET',
  handler: usersHandler.getOne,
  config: {
    description: 'get a user',
    auth: 'jwt',
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
