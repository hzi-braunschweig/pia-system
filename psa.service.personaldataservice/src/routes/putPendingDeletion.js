const Joi = require('joi');

const pendingDeletionsHandler = require('../handlers/pendingDeletionsHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/personal/pendingdeletions/{proband_id}',
  method: 'PUT',
  handler: pendingDeletionsHandler.updateOne,
  options: {
    description: 'confirms a deletion request',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        proband_id: Joi.string()
          .description('the id of proband for deletion to confirm')
          .required(),
      }).unknown(),
    },
  },
};
