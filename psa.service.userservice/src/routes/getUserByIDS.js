const Joi = require('joi');

const usersHandler = require('../handlers/usersHandler.js');

module.exports = {
  path: '/user/users/ids/{ids}',
  method: 'GET',
  handler: usersHandler.getUserByIDS,
  config: {
    description: 'get a user by his ids',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        ids: Joi.string().description('the ids/uuid of the user').required(),
      }).unknown(),
    },
  },
};
