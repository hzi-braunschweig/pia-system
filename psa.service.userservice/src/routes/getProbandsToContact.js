const probandsHandler = require('../handlers/probandsHandler.js');

module.exports = {
  path: '/user/probandstocontact',
  method: 'GET',
  handler: probandsHandler.getProbandsToContact,
  config: {
    description: 'get all probands to be contacted',
    auth: 'jwt',
    tags: ['api'],
  },
};
