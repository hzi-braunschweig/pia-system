const userLogRepository = require('../../repositories/userLogRepository');

class InternalUserLogInteractor {
  static async postLog(user_id, log) {
    return await userLogRepository.postLog(user_id, log);
  }

  /**
   *
   * @param {string} userId
   * @param {UserLogFilter} filter
   * @return {Promise<null>}
   */
  static async deleteLog(userId, filter) {
    return await userLogRepository.deleteLog(userId, filter);
  }
}

module.exports = InternalUserLogInteractor;
