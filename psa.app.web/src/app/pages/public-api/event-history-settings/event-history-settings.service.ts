/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EventHistorySettingsDto } from './event-history-settings.dto';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EventHistorySettingsService {
  private readonly apiUrl = 'api/v1/event-history';

  constructor(private readonly http: HttpClient) {}

  public get(): Observable<EventHistorySettingsDto> {
    return this.http.get<EventHistorySettingsDto>(`${this.apiUrl}/config`);
  }

  public post(
    config: Partial<EventHistorySettingsDto>
  ): Observable<EventHistorySettingsDto> {
    return this.http.post<EventHistorySettingsDto>(
      `${this.apiUrl}/config`,
      config
    );
  }
}
