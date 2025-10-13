/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  EmailRecipient,
  EmailRequest,
  NotificationCreationRequest,
  NotificationCreationResponse,
  NotificationDto,
} from '../../models/notification';

@Injectable()
export class NotificationService {
  private readonly apiUrl = 'api/v1/notification/';

  constructor(public http: HttpClient) {}

  async postFCMToken(token): Promise<string> {
    return this.http
      .post<string>(this.apiUrl + 'fcmToken', { fcm_token: token })
      .toPromise();
  }

  /**
   * Sends a mail to multiple probands. Returns a list of mail addresses to which
   * the mail was successfully sent.
   */
  async sendEmail(email: EmailRequest): Promise<EmailRecipient[]> {
    return this.http
      .post<EmailRecipient[]>(this.apiUrl + 'email', email)
      .toPromise();
  }

  async sendNotification(
    notification: NotificationCreationRequest
  ): Promise<NotificationCreationResponse> {
    return this.http
      .post<NotificationCreationResponse>(
        this.apiUrl + 'notification',
        notification
      )
      .toPromise();
  }

  async getNotificationById(id): Promise<NotificationDto> {
    return this.http
      .get<NotificationDto>(this.apiUrl + 'notification/' + id)
      .toPromise();
  }
}
