const Joi = require('joi');

const laboratoryResultsHandler = require('../handlers/laboratoryResultsHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/sample/probands/{user_id}/labResults',
  method: 'POST',
  handler: laboratoryResultsHandler.createOneResult,
  options: {
    description: 'creates a single laboratory result',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        user_id: Joi.string()
          .description('the username of the proband')
          .required(),
      }).unknown(),
      payload: Joi.object({
        sample_id: Joi.string()
          .uppercase()
          .description('the id of the sample')
          .default('TEST-987654321')
          .required(),
        dummy_sample_id: Joi.string()
          .uppercase()
          .description('the id of the backup sample')
          .default(null)
          .optional()
          .allow('')
          .allow(null),
        new_samples_sent: Joi.boolean()
          .description(
            'true if the sample was sent to the tn, false otherwise, null if handed out directly (UT)'
          )
          .allow(null),
      }),
    },
  },
};
