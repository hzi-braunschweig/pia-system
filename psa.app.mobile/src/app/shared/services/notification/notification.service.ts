/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { NotificationClientService } from './notification-client.service';
import { NotificationPresenterService } from './notification-presenter.service';
import { AuthService } from '../../../auth/auth.service';
import type { PluginListenerHandle } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private currentUser: string;

  private lastUndeliveredMessage: {
    username: string;
    notificationId: string;
  } = null;

  private subscriptions: (Subscription | PluginListenerHandle)[] = [];

  constructor(
    private notificationPresenter: NotificationPresenterService,
    private notificationClient: NotificationClientService,
    private auth: AuthService
  ) {}

  async initPushNotifications(username: string) {
    this.currentUser = username;
    await this.presentLastUndeliveredMessage();

    let permStatus = await PushNotifications.checkPermissions();

    if (
      permStatus.receive === 'prompt' ||
      permStatus.receive === 'prompt-with-rationale'
    ) {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('user denied permissions for push notifications');
      return;
    }

    await this.unsubscribeLocalListeners();
    this.subscriptions.push(
      await PushNotifications.addListener(
        'registration',
        (token: { value: string }) => {
          this.updateToken(token.value);
        }
      ),
      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          console.log('Push received:', notification);
        }
      ),
      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          if (notification.notification.data?.id) {
            this.openNotification(notification.notification.data.id);
          }
        }
      ),
      this.auth.isAuthenticated$
        .pipe(filter((isAuthenticated) => !isAuthenticated))
        .subscribe(async () => {
          await Promise.all([
            PushNotifications.unregister(),
            PushNotifications.removeAllDeliveredNotifications(),
            PushNotifications.removeAllListeners(),
            this.unsubscribeLocalListeners(),
          ]);
        })
    );

    await PushNotifications.register();
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

  private async unsubscribeLocalListeners() {
    for (const sub of this.subscriptions) {
      if ('unsubscribe' in sub) {
        sub.unsubscribe();
      } else {
        await sub.remove();
      }
    }
    this.subscriptions = [];
  }
}
