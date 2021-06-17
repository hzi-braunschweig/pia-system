const Joi = require('joi');
const internalUserLogHandler = require('../../handlers/internal/internalUserLogHandler');

module.exports = {
  path: '/log/logs/{userId}',
  method: 'DELETE',
  handler: internalUserLogHandler.deleteLog,
  config: {
    description: 'deletes all log records of a user',
    tags: ['api'],
    validate: {
      query: Joi.object({
        fromTime: Joi.date()
          .description('begin of the time interval you want to search')
          .empty('')
          .default(new Date(0)),
        toTime: Joi.date()
          .description('the end of the time interval you want to search')
          .empty('')
          .default(() => new Date()),
      }),
    },
  },
};
