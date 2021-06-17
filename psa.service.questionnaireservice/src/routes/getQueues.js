const Joi = require('joi');

const queuesHandler = require('../handlers/queuesHandler.js');

module.exports = {
  path: '/questionnaire/probands/{user_id}/queues',
  method: 'GET',
  handler: queuesHandler.getAll,
  config: {
    description:
      'get all queued instances for the proband if the user has access',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        user_id: Joi.string().description('the id of the user').required(),
      }).unknown(),
    },
  },
};
