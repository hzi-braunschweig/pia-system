const systemLogInteractor = require('../interactors/systemLogInteractor');

class SystemLogHandler {
  /**
   *
   * @param {import('@hapi/hapi').Request} request
   * @return {Promise<SystemLogRes[]>}
   */
  static async getSystemLogs(request) {
    return systemLogInteractor.getSystemLogs(
      request.auth.credentials,
      request.query
    );
  }
}

module.exports = SystemLogHandler;
