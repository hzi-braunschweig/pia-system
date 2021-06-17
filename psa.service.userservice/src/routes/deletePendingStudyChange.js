const Joi = require('joi');

const pendingStudyChangesHandler = require('../handlers/pendingStudyChangesHandler.js');

module.exports = {
  path: '/user/pendingstudychanges/{id}',
  method: 'DELETE',
  handler: pendingStudyChangesHandler.deleteOne,
  config: {
    description: 'cancels a pending study change',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .description('the pending study change id to cancel')
          .required(),
      }).unknown(),
    },
  },
};
