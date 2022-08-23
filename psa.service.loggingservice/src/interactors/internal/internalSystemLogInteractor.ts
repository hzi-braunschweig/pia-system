/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SystemLogRepository } from '../../repositories/systemLogRepository';
import { SystemLogReq, SystemLogRes } from '../../model/systemLog';

export class InternalSystemLogInteractor {
  /**
   * Creates a new system log
   */
  public static async postSystemLog(log: SystemLogReq): Promise<SystemLogRes> {
    const logDb = await SystemLogRepository.createSystemLog(log);
    return {
      requestedBy: logDb.requested_by,
      requestedFor: logDb.requested_for,
      timestamp: new Date(logDb.timestamp),
      type: logDb.type,
    };
  }
}
