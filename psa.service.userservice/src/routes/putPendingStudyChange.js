const Joi = require('joi');

const pendingStudyChangesHandler = require('../handlers/pendingStudyChangesHandler.js');

module.exports = {
  path: '/user/pendingstudychanges/{id}',
  method: 'PUT',
  handler: pendingStudyChangesHandler.updateOne,
  config: {
    description: 'confirms a pending study change request',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description('the id of the pending study change to confirm')
          .required(),
      }).unknown(),
    },
  },
};
