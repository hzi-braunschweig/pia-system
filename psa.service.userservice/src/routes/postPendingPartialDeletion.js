const Joi = require('joi');

const pendingPartialDeletionsHandler = require('../handlers/pendingPartialDeletionsHandler.js');

module.exports = {
  path: '/user/pendingpartialdeletions',
  method: 'POST',
  handler: pendingPartialDeletionsHandler.createOne,
  config: {
    description: 'creates a partial deletion request',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        requestedFor: Joi.string()
          .required()
          .description('the user who should confirm the deletion'),
        probandId: Joi.string()
          .required()
          .description('the probands username to delete data for'),
        fromDate: Joi.date()
          .description('the first date to delete data for')
          .empty('')
          .empty(null)
          .default(new Date(0)),
        toDate: Joi.date()
          .description('the last date to delete data for')
          .empty('')
          .empty(null)
          .default(() => new Date()),
        deleteLogs: Joi.boolean()
          .default(false)
          .description('whether logs should be deleted or not'),
        forInstanceIds: Joi.array()
          .description('ids of questionnaire instances to delete')
          .items(
            Joi.number().integer().description('a questionnaire instance id')
          )
          .allow(null)
          .default(null),
        forLabResultsIds: Joi.array()
          .description('ids of lab results to delete')
          .items(Joi.string().description('a labresult id'))
          .allow(null)
          .default(null),
      }).unknown(),
    },
  },
};
