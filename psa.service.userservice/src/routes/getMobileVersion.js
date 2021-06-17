const usersHandler = require('../handlers/usersHandler.js');

module.exports = {
  path: '/user/mobileVersion',
  method: 'GET',
  handler: usersHandler.getMobileVersion,
  config: {
    description: 'get a mobile version',
    tags: ['api'],
  },
};
