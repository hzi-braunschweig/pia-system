const plannedProbandsHandler = require('../handlers/plannedProbandsHandler.js');

module.exports = {
  path: '/user/plannedprobands',
  method: 'GET',
  handler: plannedProbandsHandler.getAll,
  config: {
    description: 'get all planned probands',
    auth: 'jwt',
    tags: ['api'],
  },
};
