const Joi = require('joi');

const internalComplianceHandler = require('../../handlers/internal/internalComplianceHandler.js');

module.exports = {
  path: '/compliance/{study}/agree/{userId}',
  method: 'GET',
  handler: internalComplianceHandler.hasComplianceAgree,
  config: {
    description: 'checks if the submitted consents are given',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study: Joi.string().description('the name of the study').required(),
        userId: Joi.string().description('the name of the user').required(),
      }).unknown(),
      query: Joi.object({
        system: Joi.array()
          .items(
            Joi.string().valid('app', 'samples', 'bloodsamples', 'labresults')
          )
          .single()
          .description('the system consents to check')
          .optional(),
        generic: Joi.array()
          .items(Joi.string())
          .single()
          .description(
            'the generic consents (defined by the researcher) to check'
          )
          .optional(),
      }),
    },
  },
};
