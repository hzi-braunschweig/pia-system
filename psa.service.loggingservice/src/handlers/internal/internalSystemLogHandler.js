const internalSystemLogInteractor = require('../../interactors/internal/internalSystemLogInteractor');
const Boom = require('@hapi/boom');

class InternalSystemLogHandler {
  /**
   * Creates a new system log entry
   * @param {import('@hapi/hapi').Request} request
   * @return {Promise<SystemLogRes>}
   */
  static async postLog(request) {
    return internalSystemLogInteractor
      .postSystemLog(request.payload)
      .catch((e) => {
        request.log('error', e.stack + JSON.stringify(e, null, 2));
        throw Boom.boomify(e);
      });
  }
}

module.exports = InternalSystemLogHandler;
