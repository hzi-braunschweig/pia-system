const Joi = require('joi');

const notificationHandler = require('../handlers/notificationHandler.js');

module.exports = {
  path: '/notification/notification/{id}',
  method: 'GET',
  handler: notificationHandler.getOne,
  config: {
    description: 'get the notification with the specified id',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire')
          .required(),
      }).unknown(),
    },
  },
};
