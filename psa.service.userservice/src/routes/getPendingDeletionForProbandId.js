const Joi = require('joi');

const pendingDeletionsHandler = require('../handlers/pendingDeletionsHandler.js');

module.exports = {
  path: '/user/pendingdeletions/proband/{proband_id}',
  method: 'GET',
  handler: pendingDeletionsHandler.getOneForProbandId,
  config: {
    description: 'get a pending deletion',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        proband_id: Joi.string()
          .description(
            'the proband id of the proband for pending deletion to get'
          )
          .required(),
      }).unknown(),
    },
  },
};
