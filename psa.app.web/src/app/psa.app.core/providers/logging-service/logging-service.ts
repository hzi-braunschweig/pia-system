/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SystemLog, SystemLogFilter } from '../../models/systemLog';

@Injectable()
export class LoggingService {
  private readonly apiUrl = 'api/v1/log/';

  constructor(private readonly http: HttpClient) {}

  async getSystemLogs(query: SystemLogFilter): Promise<SystemLog[]> {
    return this.http
      .get<SystemLog[]>(this.apiUrl + `systemLogs`, { params: { ...query } })
      .toPromise();
  }
}
