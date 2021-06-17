const fetch = require('node-fetch');
const Boom = require('@hapi/boom');
const { config } = require('../config');

const serviceUrl = config.services.loggingservice.url;

/**
 * @typedef {{
 *     [fromTime]: Date,
 *     [toTime]: Date
 * }} UserLogFilter
 * @typedef {{
 *     requestedBy: string,
 *     requestedFor: string,
 *     type: string
 * }} SystemLogReq
 *
 * @typedef {{
 *     requestedBy: string,
 *     requestedFor: string,
 *     timestamp: Date,
 *     type: ('proband'|'sample'|'study'|'compliance'|'study_change'|'partial')
 * }} SystemLogRes
 */

class LoggingserviceClient {
  /**
   *
   * @param userId
   * @param {UserLogFilter} filter
   * @return {Promise<void>}
   */
  static async deleteLogs(userId, filter) {
    let res;
    try {
      let query = '';
      if (filter) {
        const params = new URLSearchParams();
        if (filter.fromTime instanceof Date)
          params.append('fromTime', filter.fromTime.toISOString());
        if (filter.toTime instanceof Date)
          params.append('toTime', filter.toTime.toISOString());
        query = '?' + params.toString();
      }
      res = await fetch.default(`${serviceUrl}/log/logs/${userId}${query}`, {
        method: 'delete',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        'loggingserviceClient deleteLogs: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'loggingserviceClient deleteLogs: received an Error',
        await res.text(),
        res.status
      );
    }
  }

  /**
   *
   * @param {SystemLogReq} log
   * @return {Promise<SystemLogRes>}
   */
  static async createSystemLog(log) {
    let res;
    try {
      res = await fetch.default(`${serviceUrl}/log/systemLogs`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        'loggingserviceClient createSystemLog: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'loggingserviceClient createSystemLog: received an Error',
        await res.text(),
        res.status
      );
    }
    return await res.json();
  }
}

module.exports = LoggingserviceClient;
