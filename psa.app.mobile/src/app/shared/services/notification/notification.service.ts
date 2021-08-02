/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { NotificationClientService } from './notification-client.service';
import { NotificationPresenterService } from './notification-presenter.service';
import { AuthService } from '../../../auth/auth.service';

/**
 * @example
 * {
 *    body: "Bitte tippen Sie auf diese Meldung, um Sie anzuzeigen."
 *    collapse_key: "pia.ionic.ios"
 *    from: "10158607305"
 *    id: "9002"
 *    messageType: "notification"
 *    sent_time: "1606984493978"
 *    show_notification: "false"
 *    title: "PIA - Sie haben eine neue Nachricht."
 *    ttl: "2419200"
 * }
 *
 */
interface PushNotification {
  body: string;
  collapse_key: string;
  from: string;
  id: string;
  messageType: 'notification' | 'data';
  tap: 'foreground' | 'background';
  sent_time: string;
  show_notification: 'true' | 'false';
  title: string;
  ttl: string;
}

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
      this.fcm.onTokenRefresh().subscribe((token) => this.updateToken(token))
    );
    this.subscriptions.push(
      this.fcm
        .onMessageReceived()
        .pipe(filter((data) => data.tap))
        .subscribe((data: PushNotification) => this.openNotification(data.id))
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
    if (this.auth.isAuthenticated()) {
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
