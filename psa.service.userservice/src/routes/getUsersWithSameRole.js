const usersHandler = require('../handlers/usersHandler.js');

module.exports = {
  path: '/user/usersWithSameRole',
  method: 'GET',
  handler: usersHandler.getAllWithSameRole,
  config: {
    description: 'get all users with the same role as a requester',
    auth: 'jwt',
    tags: ['api'],
  },
};
