const Joi = require('joi');
const internalUserLogHandler = require('../../handlers/internal/internalUserLogHandler');

module.exports = {
  path: '/log/logs/{user_id}',
  method: 'POST',
  handler: internalUserLogHandler.postLog,
  config: {
    description: 'inserts a user log record',
    tags: ['api'],
    validate: {
      params: Joi.object({
        user_id: Joi.string()
          .description('the username of the proband')
          .required(),
      }).unknown(),
      payload: Joi.object({
        timestamp: Joi.date()
          .description('the time of the activity')
          .required(),
        activity: Joi.object().keys({
          type: Joi.string()
            .valid('login', 'logout', 'q_released_twice', 'q_released_once')
            .required(),
          questionnaireID: Joi.number(),
          questionnaireName: Joi.string(),
          questionnaireInstanceId: Joi.number(),
        }),
        app: Joi.string().valid('web', 'ios', 'android', 'n.a').required(),
      }).unknown(),
    },
  },
};
