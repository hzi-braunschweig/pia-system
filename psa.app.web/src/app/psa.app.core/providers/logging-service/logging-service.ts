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

  constructor(private http: HttpClient) {}

  getLogs(query): Promise<any> {
    // This request may have a very long URI therefore,
    // a POST method type was used in order to send the parameters as payload
    if (query && query.questionnaires) {
      query.questionnaires = query.questionnaires.map(String);
    }
    return this.http.post(this.apiUrl + `logs`, query).toPromise();
  }

  getSystemLogs(query: SystemLogFilter): Promise<SystemLog[]> {
    return this.http
      .get<SystemLog[]>(this.apiUrl + `systemLogs`, { params: { ...query } })
      .toPromise();
  }
}
