const Joi = require('joi');

const plannedProbandsHandler = require('../handlers/plannedProbandsHandler.js');

module.exports = {
  path: '/user/plannedprobands',
  method: 'POST',
  handler: plannedProbandsHandler.createSome,
  config: {
    description: 'creates planned probands',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        pseudonyms: Joi.array()
          .required()
          .items(
            Joi.string()
              .description('the pseudonym of a planned proband')
              .default('pseudonym1')
          )
          .min(1),
      }).unknown(),
    },
  },
};
