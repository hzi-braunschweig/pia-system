const Joi = require('joi');

const pendingDeletionsHandler = require('../handlers/pendingDeletionsHandler.js');

module.exports = {
  path: '/user/pendingdeletions/sample/{sample_id}',
  method: 'GET',
  handler: pendingDeletionsHandler.getOneForSampleId,
  config: {
    description: 'get a pending deletion',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        sample_id: Joi.string()
          .description(
            'the sample id of the proband for pending deletion to get'
          )
          .required(),
      }).unknown(),
    },
  },
};
