const Joi = require('joi');

const internalPersonalDataHandler = require('../../handlers/internal/internalPersonalDataHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/personal/personalData/proband/{username}/email',
  method: 'GET',
  handler: internalPersonalDataHandler.getEmail,
  options: {
    description: 'Gets the email from the personal data of the given proband',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the probands username to delete data for')
          .required(),
      }).unknown(),
    },
    response: {
      schema: Joi.string().email(),
    },
  },
};
