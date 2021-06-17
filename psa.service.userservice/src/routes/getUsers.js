const usersHandler = require('../handlers/usersHandler.js');

module.exports = {
  path: '/user/users',
  method: 'GET',
  handler: usersHandler.getAll,
  config: {
    description: 'get all users the requester has access to',
    auth: 'jwt',
    tags: ['api'],
  },
};
