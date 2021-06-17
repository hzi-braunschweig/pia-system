const Joi = require('joi');

const loginHandler = require('../handlers/loginHandler.js');

module.exports = {
  path: '/user/login',
  method: 'POST',
  handler: loginHandler.login,
  config: {
    description: 'Login',
    auth: {
      strategy: 'jwt_login',
      mode: 'optional',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        logged_in_with: Joi.string()
          .required()
          .default('web')
          .valid('web', 'ios', 'android'),
        password: Joi.string().max(80).required().allow(''),
        username: Joi.string().optional(),
        locale: Joi.string().optional(),
      }).unknown(),
    },
    app: {
      /**
       * Whenever this route resolves with status code 200 and the user has enabled logging,
       * this method will be called by the LoggingHandler in order to allow to post a log entry
       *
       * @param request the hapi request object
       * @param user the decoded token of the requesting user
       * @param postLogActivity method which receives the logging activity and logs to the logging service
       */
      log: (request, user, postLogActivity) => {
        postLogActivity({ type: 'login' });
      },
    },
  },
};
