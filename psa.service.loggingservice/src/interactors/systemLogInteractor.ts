/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SystemLogRepository } from '../repositories/systemLogRepository';
import { SystemLogFilter, SystemLogRes } from '../model/systemLog';

export class SystemLogInteractor {
  /**
   * Gets all system logs fitting the filter
   */
  public static async getSystemLogs(
    filter: SystemLogFilter
  ): Promise<SystemLogRes[]> {
    const logsDb = await SystemLogRepository.getSystemLogs(filter);
    return logsDb.map((logDb) => ({
      requestedBy: logDb.requested_by,
      requestedFor: logDb.requested_for,
      timestamp: new Date(logDb.timestamp),
      type: logDb.type,
    }));
  }
}
