const Boom = require('@hapi/boom');
const systemLogRepository = require('../repositories/systemLogRepository');

class SystemLogInteractor {
  /**
   * Gets all system logs fitting the filter
   * @param {DecodedToken} decodedToken
   * @param {RequestQuery} filter
   * @return {Promise<SystemLogRes[]>}
   */
  static async getSystemLogs(decodedToken, filter) {
    if (decodedToken.role === 'SysAdmin') {
      const logsDb = await systemLogRepository.getSystemLogs(filter);
      return logsDb.map((logDb) => ({
        requestedBy: logDb.requested_by,
        requestedFor: logDb.requested_for,
        timestamp: new Date(logDb.timestamp),
        type: logDb.type,
      }));
    } else {
      throw Boom.forbidden('Wrong role for this command');
    }
  }
}

module.exports = SystemLogInteractor;
