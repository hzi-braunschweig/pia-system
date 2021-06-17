const Joi = require('joi');
const statusHandler = require('../../handlers/internal/statusHandler');

module.exports = {
  path: '/sormas/probands/setStatus',
  method: 'POST',
  handler: statusHandler.setStatus,
  config: {
    description: 'sets the status of a proband in SORMAS',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        uuid: Joi.string().required().description('sormas uuid'),
        status: Joi.string()
          .required()
          .valid('REGISTERED', 'ACCEPTED', 'REJECTED', 'DELETED')
          .description('sormas status text'),
      }),
    },
  },
};
