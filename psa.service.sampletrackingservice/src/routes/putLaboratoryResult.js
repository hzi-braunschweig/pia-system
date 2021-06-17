const Joi = require('joi');

const laboratoryResultsHandler = require('../handlers/laboratoryResultsHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/sample/probands/{user_id}/labResults/{result_id}',
  method: 'PUT',
  handler: laboratoryResultsHandler.updateOneResult,
  options: {
    description: 'updates a single laboratory result',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        user_id: Joi.string()
          .description('the username of the proband')
          .required(),
        result_id: Joi.string()
          .uppercase()
          .description('the id of the lab result')
          .required(),
      }).unknown(),
      payload: Joi.object({
        remark: Joi.string()
          .allow('')
          .description('a free remark text the PM can save')
          .optional(),
        new_samples_sent: Joi.boolean()
          .description('true if new samples have been sent to the proband')
          .optional(),
        date_of_sampling: Joi.date()
          .description('the date when the proband created the sample')
          .optional(),
        dummy_sample_id: Joi.string()
          .uppercase()
          .description('a Bact-sample ID')
          .optional(),
        status: Joi.string()
          .valid('inactive', 'new')
          .description('status of the sample')
          .optional(),
      }),
    },
  },
};
