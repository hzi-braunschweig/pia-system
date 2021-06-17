const Joi = require('joi');

const fileHandler = require('../handlers/fileHandler');

module.exports = {
  path: '/questionnaire/files/{id}',
  method: 'GET',
  handler: fileHandler.getFileById,
  config: {
    description: 'get single file',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string().description('file id').required(),
      }).unknown(),
    },
  },
};
