/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getDbTransactionFromOptionsOrDbConnection } from '../db';
import { SystemLogDb, SystemLogFilter, SystemLogReq } from '../model/systemLog';
import { RepositoryOptions } from '@pia/lib-service-core';

export class SystemLogRepository {
  /**
   * Gets system logs by filter
   */
  public static async getSystemLogs(
    filter: SystemLogFilter,
    options?: RepositoryOptions
  ): Promise<SystemLogDb[]> {
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
   */
  public static async createSystemLog(
    log: SystemLogReq,
    options?: RepositoryOptions
  ): Promise<SystemLogDb> {
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
