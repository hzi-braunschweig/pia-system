const questionnairesHandler = require('../handlers/questionnairesHandler.js');

module.exports = {
  path: '/questionnaire/questionnaires',
  method: 'GET',
  handler: questionnairesHandler.getAll,
  config: {
    description: 'get all questionnaires the researcher has access to',
    auth: 'jwt',
    tags: ['api'],
  },
};
