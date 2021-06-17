const complianceHandler = require('../handlers/complianceHandler.js');

module.exports = {
  path: '/compliance/agree/all',
  method: 'GET',
  handler: complianceHandler.getCompliancesForProfessional,
  config: {
    description: 'fetches compliance agreements for a professional user',
    auth: 'jwt',
    tags: ['api'],
  },
};
