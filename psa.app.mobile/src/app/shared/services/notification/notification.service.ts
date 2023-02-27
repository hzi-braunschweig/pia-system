/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseX } from '@awesome-cordova-plugins/firebase-x/ngx';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { NotificationClientService } from './notification-client.service';
import { NotificationPresenterService } from './notification-presenter.service';
import { AuthService } from '../../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private currentUser: string;

  private lastUndeliveredMessage: {
    username: string;
    notificationId: string;
  } = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private notificationPresenter: NotificationPresenterService,
    private notificationClient: NotificationClientService,
    private fcm: FirebaseX,
    private router: Router,
    private auth: AuthService
  ) {}

  async initPushNotifications(username: string) {
    this.currentUser = username;
    await this.presentLastUndeliveredMessage();

    if (!(await this.fcm.hasPermission())) {
      // only requested on iOS, always implicitly granted on Android
      await this.fcm.grantPermission();
    }

    await this.updateToken(await this.fcm.getToken());
    this.unsubscribe();
    this.subscriptions.push(
      this.fcm.onTokenRefresh().subscribe((token) => this.updateToken(token)),

      this.fcm
        .onMessageReceived()
        .pipe(filter((data) => !!data.tap && !!data.id))
        .subscribe((data) => this.openNotification(data.id)),

      this.auth.isAuthenticated$
        .pipe(filter((isAuthenticated) => !isAuthenticated))
        .subscribe(async () => await this.fcm.unregister())
    );
  }

  private async updateToken(token: string) {
    if (!token) {
      return;
    }
    try {
      await this.notificationClient.postFCMToken(token);
    } catch (error) {
      console.error(error);
    }
  }

  private async openNotification(notificationId: string) {
    if (await this.auth.isAuthenticated()) {
      await this.notificationPresenter.present(notificationId);
    } else {
      this.lastUndeliveredMessage = {
        username: this.currentUser,
        notificationId,
      };
    }
  }

  private async presentLastUndeliveredMessage() {
    if (
      this.lastUndeliveredMessage &&
      this.currentUser === this.lastUndeliveredMessage.username
    ) {
      await this.notificationPresenter.present(
        this.lastUndeliveredMessage.notificationId
      );
    }
    this.lastUndeliveredMessage = null;
  }

  private unsubscribe() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];
  }
}
