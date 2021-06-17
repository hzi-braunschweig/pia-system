const systemLogRepository = require('../../repositories/systemLogRepository');

class InternalSystemLogInteractor {
  /**
   * Creates a new system log
   * @param {SystemLogReq} log
   * @return {Promise<SystemLogRes>}
   */
  static async postSystemLog(log) {
    const logDb = await systemLogRepository.createSystemLog(log);
    return {
      requestedBy: logDb.requested_by,
      requestedFor: logDb.requested_for,
      timestamp: new Date(logDb.timestamp),
      type: logDb.type,
    };
  }
}

module.exports = InternalSystemLogInteractor;
