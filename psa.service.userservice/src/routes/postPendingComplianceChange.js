const Joi = require('joi');

const pendingComplianceChangesHandler = require('../handlers/pendingComplianceChangesHandler.js');

module.exports = {
  path: '/user/pendingcompliancechanges',
  method: 'POST',
  handler: pendingComplianceChangesHandler.createOne,
  config: {
    description: 'creates a pending compliance change request',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        requested_for: Joi.string()
          .required()
          .description('the user who should confirm the deletion'),
        proband_id: Joi.string()
          .required()
          .description(
            'the id the proband the pending deletion request is associated with'
          ),
        compliance_labresults_to: Joi.boolean()
          .optional()
          .description('the new value for the compliance to see labresults'),
        compliance_samples_to: Joi.boolean()
          .optional()
          .description('the new value for the compliance to take samples'),
        compliance_bloodsamples_to: Joi.boolean()
          .optional()
          .description('the new value for the compliance to take bloodsamples'),
      }).unknown(),
    },
  },
};
