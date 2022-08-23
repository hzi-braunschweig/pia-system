/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { SystemLogFilter, SystemLogRes } from '../model/systemLog';

import { SystemLogInteractor } from '../interactors/systemLogInteractor';

export class SystemLogHandler {
  public static getSystemLogs: Lifecycle.Method = async (
    request
  ): Promise<SystemLogRes[]> => {
    return SystemLogInteractor.getSystemLogs(request.query as SystemLogFilter);
  };
}
