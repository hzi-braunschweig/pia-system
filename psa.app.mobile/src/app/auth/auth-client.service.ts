/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Login, LoginResponse } from './auth.model';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthClientService {
  private getApiUrl() {
    return this.endpoint.getUrl() + '/api/v1/user/';
  }

  constructor(
    private http: HttpClient,
    private endpoint: EndpointService,
    private auth: AuthService
  ) {}

  login(credentials: Login): Promise<LoginResponse> {
    return this.http
      .post<LoginResponse>(this.getApiUrl() + 'login', credentials)
      .toPromise();
  }

  requestNewPassword(userId: string): Promise<any> {
    return this.http
      .put(
        this.getApiUrl() + 'newPassword',
        { user_id: userId },
        { responseType: 'text' }
      )
      .toPromise();
  }

  changePassword(credentials: object): Promise<void> {
    return this.http
      .post<void>(this.getApiUrl() + 'changePassword', credentials)
      .toPromise();
  }
}
