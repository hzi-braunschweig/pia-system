const Joi = require('joi');

const probandsHandler = require('../handlers/probandsHandler.js');

module.exports = {
  path: '/user/probandstocontact/{id}',
  method: 'PUT',
  handler: probandsHandler.updateOne,
  config: {
    description: 'confirms a deletion request',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number().description('the id of the record').required(),
      }).unknown(),
      payload: Joi.object({
        processed: Joi.boolean()
          .optional()
          .description('the proband has been contacted')
          .required()
          .default(false),
      }).unknown(),
    },
  },
};
