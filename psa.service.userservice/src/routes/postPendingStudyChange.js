const Joi = require('joi');

const pendingStudyChangesHandler = require('../handlers/pendingStudyChangesHandler.js');

module.exports = {
  path: '/user/pendingstudychanges',
  method: 'POST',
  handler: pendingStudyChangesHandler.createOne,
  config: {
    description: 'creates a pending study change request',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        requested_for: Joi.string()
          .required()
          .description('the user who should confirm the deletion'),
        study_id: Joi.string()
          .required()
          .description(
            'the id of the study the pending study request is associated with'
          ),
        description_to: Joi.string()
          .optional()
          .allow(null)
          .description('the new value for the description of the study'),
        has_rna_samples_to: Joi.boolean()
          .optional()
          .description('the new value for has_rna_samples of the study'),
        sample_prefix_to: Joi.string()
          .optional()
          .allow(null)
          .allow('')
          .description('the new value for sample_prefix of the study'),
        sample_suffix_length_to: Joi.number()
          .optional()
          .allow(null)
          .description('the new value for sample_suffix_length of the study'),
        pseudonym_prefix_to: Joi.string()
          .optional()
          .allow(null)
          .allow('')
          .description('the new value for pseudonym_prefix of the study'),
        pseudonym_suffix_length_to: Joi.number()
          .optional()
          .allow(null)
          .description(
            'the new value for pseudonym_suffix_length of the study'
          ),
        has_answers_notify_feature_to: Joi.boolean()
          .optional()
          .description(
            'the new value for has_answers_notify_feature of the study'
          ),
        has_answers_notify_feature_by_mail_to: Joi.boolean()
          .optional()
          .description(
            'the new value for has_answers_notify_feature_by_mail of the study'
          ),
        has_four_eyes_opposition_to: Joi.boolean()
          .optional()
          .description(
            'the new value for has_four_eyes_opposition of the study'
          ),
        has_partial_opposition_to: Joi.boolean()
          .optional()
          .description('the new value for has_partial_opposition of the study'),
        has_total_opposition_to: Joi.boolean()
          .optional()
          .description('the new value for has_total_opposition of the study'),
        has_compliance_opposition_to: Joi.boolean()
          .optional()
          .description(
            'the new value for has_compliance_opposition of the study'
          ),
        has_logging_opt_in_from: Joi.boolean()
          .optional()
          .description('the old value for has_logging_opt_in_from'),
        has_logging_opt_in_to: Joi.boolean()
          .optional()
          .description('the new value for has_logging_opt_in_from'),
      }).unknown(),
    },
  },
};
