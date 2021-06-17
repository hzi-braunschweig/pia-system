const Joi = require('joi');

const userSettingsHandler = require('../handlers/userSettingsHandler.js');

module.exports = {
  path: '/user/userSettings/{username}',
  method: 'GET',
  handler: userSettingsHandler.getOne,
  config: {
    description: 'gets the users settings',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the name of the user')
          .required()
          .default('Testproband1'),
      }).unknown(),
    },
  },
};
