const studiesHandler = require('../handlers/studiesHandler.js');

module.exports = {
  path: '/questionnaire/studies/addresses',
  method: 'GET',
  handler: studiesHandler.getStudyAddresses,
  config: {
    description: 'get the study addresses',
    auth: 'jwt',
    tags: ['api'],
  },
};
