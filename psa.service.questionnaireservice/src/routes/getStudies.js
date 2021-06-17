const studiesHandler = require('../handlers/studiesHandler.js');

module.exports = {
  path: '/questionnaire/studies',
  method: 'GET',
  handler: studiesHandler.getAll,
  config: {
    description: 'get all studies the user has access to',
    auth: 'jwt',
    tags: ['api'],
  },
};
