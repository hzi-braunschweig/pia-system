const Joi = require('joi');

const plannedProbandsHandler = require('../handlers/plannedProbandsHandler.js');

module.exports = {
  path: '/user/plannedprobands/{user_id}',
  method: 'GET',
  handler: plannedProbandsHandler.getOne,
  config: {
    description: 'get a planned proband',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        user_id: Joi.string()
          .description('the pseudonym of the planned proband')
          .required(),
      }).unknown(),
    },
  },
};
