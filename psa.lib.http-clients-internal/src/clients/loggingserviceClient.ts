/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServiceClient } from '../core/serviceClient';
import {
  SystemLogInternalDto,
  SystemLogRequestInternalDto,
} from '../dtos/systemLog';

export class LoggingserviceClient extends ServiceClient {
  public async createSystemLog(
    log: SystemLogRequestInternalDto
  ): Promise<SystemLogInternalDto> {
    return await this.httpClient.post<SystemLogInternalDto>(
      '/log/systemLogs',
      log
    );
  }
}
