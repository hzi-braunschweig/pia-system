const Joi = require('joi');
const internalSystemLogHandler = require('../../handlers/internal/internalSystemLogHandler');

module.exports = {
  path: '/log/systemLogs',
  method: 'POST',
  handler: internalSystemLogHandler.postLog,
  config: {
    description: 'inserts a system log record',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        requestedBy: Joi.string().required(),
        requestedFor: Joi.string().required(),
        timestamp: Joi.date().optional(),
        type: Joi.string()
          .valid(
            'proband',
            'sample',
            'study',
            'compliance',
            'study_change',
            'partial',
            'personal'
          )
          .required(),
      }).unknown(),
    },
  },
};
