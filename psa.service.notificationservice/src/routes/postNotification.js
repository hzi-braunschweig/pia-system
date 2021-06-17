const Joi = require('joi');

const notificationHandler = require('../handlers/notificationHandler.js');

module.exports = {
  path: '/notification/notification',
  method: 'POST',
  handler: notificationHandler.postOne,
  config: {
    description: 'posts a notification',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        title: Joi.string()
          .required()
          .description('the title of the notification')
          .default('Neue PIA Nachricht'),
        body: Joi.string()
          .required()
          .description('the body of the notification')
          .default('Es gibt wichtige Neuhigkeiten zu PIA!!!'),
        recipients: Joi.array()
          .items(Joi.string())
          .description('the recipients usernames of the notification')
          .default('Testproband1'),
        date: Joi.date()
          .timestamp()
          .optional()
          .description('the date to send the notification on')
          .min('now'),
      }),
    },
  },
};
