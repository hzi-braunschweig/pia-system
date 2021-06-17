const laboratoryResultsHandler = require('../handlers/laboratoryResultsHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/sample/labResultsImport',
  method: 'POST',
  handler: laboratoryResultsHandler.postLabResultsImport,
  options: {
    description: 'triggers the import of labresults from ftp server',
    auth: 'jwt',
    tags: ['api'],
  },
};
