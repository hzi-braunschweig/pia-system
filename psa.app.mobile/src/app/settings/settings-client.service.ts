/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { UserSettings } from './settings.model';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsClientService {
  private getApiUrl() {
    return this.endpoint.getUrl() + '/api/v1/user/';
  }

  constructor(private http: HttpClient, private endpoint: EndpointService) {}

  putUserSettings(
    username: string,
    putData: UserSettings
  ): Promise<UserSettings> {
    return this.http
      .put<UserSettings>(this.getApiUrl() + 'userSettings/' + username, putData)
      .toPromise();
  }

  getUserSettings(username: string): Promise<UserSettings> {
    return this.http
      .get<UserSettings>(this.getApiUrl() + 'userSettings/' + username)
      .toPromise();
  }
}
