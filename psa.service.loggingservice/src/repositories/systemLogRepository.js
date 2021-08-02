/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { getDbTransactionFromOptionsOrDbConnection } = require('../db');

class SystemLogRepository {
  /**
   * gets system logs by filter
   * @param {SystemLogFilter} filter the filter params
   * @param {RepositoryOptions} options
   * @return {Promise<SystemLogDb[]>} a resolved promise in case of success or a rejected otherwise
   */
  static async getSystemLogs(filter, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.manyOrNone(
      `SELECT id, requested_by, requested_for, timestamp, type
             FROM system_logs
             WHERE type IN ($(types:csv))
               AND timestamp >= $(fromTime)
               AND timestamp < $(toTime)`,
      filter
    );
  }

  /**
   * Creates a new system log entry
   * @param {SystemLogReq} log
   * @param {RepositoryOptions} options
   * @return {Promise<SystemLogDb>}
   */
  static async createSystemLog(log, options) {
    if (!log.timestamp) {
      log.timestamp = new Date();
    }
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return db.one(
      `INSERT INTO system_logs (requested_by, requested_for, timestamp, type)
             VALUES ($(requestedBy), $(requestedFor), $(timestamp), $(type))
             RETURNING *`,
      log
    );
  }
}

module.exports = SystemLogRepository;
