const Joi = require('joi');
const internalUsersHandler = require('../../handlers/internal/internalUsersHandler');

module.exports = {
  path: '/user/pseudonyms',
  method: 'GET',
  handler: internalUsersHandler.getPseudonyms,
  config: {
    description: 'looks up mappingId of user',
    tags: ['api'],
    validate: {
      query: Joi.object({
        study: Joi.string().description('the username of the user to query'),
        accountStatus: Joi.array()
          .single()
          .items(
            Joi.string().allow(
              'active',
              'deactivated',
              'deactivation_pending',
              'no_account'
            )
          ),
      }),
    },
  },
};
