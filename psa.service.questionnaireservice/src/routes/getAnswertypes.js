const answertypesHandler = require('../handlers/answertypesHandler.js');

module.exports = {
  path: '/questionnaire/answertypes',
  method: 'GET',
  handler: answertypesHandler.getAll,
  config: {
    description: 'get all answertypes',
    auth: 'jwt',
    tags: ['api'],
  },
};
