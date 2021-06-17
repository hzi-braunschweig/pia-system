const tokenHandler = require('../handlers/tokenHandler.js');

// This route is only used by SORMAS

module.exports = {
  path: '/user/requestToken',
  method: 'POST',
  handler: tokenHandler.requestToken,
  config: {
    description: 'Request one-time-token for authentication',
    auth: 'simple',
  },
};
