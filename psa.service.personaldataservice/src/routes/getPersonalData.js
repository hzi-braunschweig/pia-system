const personalDataHandler = require('../handlers/personalDataHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/personal/personalData',
  method: 'GET',
  handler: personalDataHandler.getAll,
  options: {
    description: 'get personal data for all probands',
    auth: 'jwt',
    tags: ['api'],
  },
};
