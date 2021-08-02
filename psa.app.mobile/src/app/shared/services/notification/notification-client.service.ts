/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { pluck } from 'rxjs/operators';

import { NotificationDto } from './notification.model';
import { EndpointService } from '../endpoint/endpoint.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationClientService {
  private getApiUrl() {
    return this.endpoint.getUrl() + '/api/v1/notification/';
  }

  constructor(public http: HttpClient, private endpoint: EndpointService) {}

  postFCMToken(token): Promise<string> {
    return this.http
      .post<{ fcm_token: string }>(this.getApiUrl() + 'fcmToken', {
        fcm_token: token,
      })
      .pipe(pluck('fcm_token'))
      .toPromise();
  }

  getNotificationById(id: string): Promise<NotificationDto> {
    return this.http
      .get<NotificationDto>(this.getApiUrl() + 'notification/' + id)
      .toPromise();
  }
}
