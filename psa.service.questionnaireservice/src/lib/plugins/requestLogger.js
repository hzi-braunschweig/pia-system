const loggingHandler = require('../loggingHandler');

/**
 * A hapi plugin to send specific logs to the Loggingservice
 * @type { import('@types/hapi__hapi').Plugin }
 */
exports.plugin = {
  name: 'request-logger',
  version: '1.0.0',
  register: async function (server) {
    server.ext('onPreResponse', async function (request, h) {
      await loggingHandler.handle(request);
      return h.continue;
    });
  },
};
