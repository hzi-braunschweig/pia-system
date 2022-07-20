/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import Boom from '@hapi/boom';

import { SystemLogReq, SystemLogRes } from '../../model/systemLog';
import { InternalSystemLogInteractor } from '../../interactors/internal/internalSystemLogInteractor';

export class InternalSystemLogHandler {
  /**
   * Creates a new system log entry
   */
  public static postLog: Lifecycle.Method = async (
    request
  ): Promise<SystemLogRes> => {
    return InternalSystemLogInteractor.postSystemLog(
      request.payload as SystemLogReq
    ).catch((e: Error) => {
      const jsonIndentation = 2;
      request.log(
        'error',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        e.stack! + JSON.stringify(e, null, jsonIndentation)
      );
      throw Boom.boomify(e);
    });
  };
}
