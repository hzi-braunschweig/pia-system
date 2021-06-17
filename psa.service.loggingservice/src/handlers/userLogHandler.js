const userLogInteractor = require('../interactors/userLogInteractor');

class UserLogHandler {
  static async getLogs(request) {
    return userLogInteractor.getLogsFor(
      request.auth.credentials,
      request.payload
    );
  }
}

module.exports = UserLogHandler;
