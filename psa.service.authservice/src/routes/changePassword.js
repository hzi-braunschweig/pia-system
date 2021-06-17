const Joi = require('joi');

const changePasswordHandler = require('../handlers/changePasswordHandler.js');

module.exports = {
  path: '/user/changePassword',
  method: 'POST',
  handler: changePasswordHandler.changePassword,
  config: {
    description: 'Change password',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        oldPassword: Joi.string().max(80).required().allow(''),
        newPassword1: Joi.string()
          .min(12)
          .max(80)
          .default('aaaaaAAAAA1!')
          .required()
          .regex(/.*[0-9].*/)
          .regex(/.*[a-z].*/)
          .regex(/.*[A-Z].*/)
          .regex(/.*[!#$%&()*+,-./:;<=>?@_{|}~\s].*/)
          .allow(''),
        newPassword2: Joi.string()
          .min(12)
          .max(80)
          .default('aaaaaAAAAA1!')
          .required()
          .regex(/.*[0-9].*/)
          .regex(/.*[a-z].*/)
          .regex(/.*[A-Z].*/)
          .regex(/.*[!#$%&()*+,\-./:;<=>?@_{|}~\s].*/)
          .allow(''),
        username: Joi.string().optional(), // This field is deprecated and not used, but kept for backwards compatibility, because a user can only change his own password
      }).unknown(),
    },
  },
};
