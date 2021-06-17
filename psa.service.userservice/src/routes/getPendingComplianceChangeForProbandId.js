const Joi = require('joi');

const pendingComplianceChangesHandler = require('../handlers/pendingComplianceChangesHandler.js');

module.exports = {
  path: '/user/pendingcompliancechanges/proband/{id}',
  method: 'GET',
  handler: pendingComplianceChangesHandler.getOneForProband,
  config: {
    description: 'get the pending pending compliance change of proband',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description(
            'the id of the proband to get the pending compliance change to for'
          )
          .required(),
      }).unknown(),
    },
  },
};
