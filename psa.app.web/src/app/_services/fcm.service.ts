/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Inject, Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';

import { NotificationService } from '../psa.app.core/providers/notification-service/notification-service';
import { AuthenticationManager } from './authentication-manager.service';
import { User } from '../psa.app.core/models/user';
import { Subscription } from 'rxjs';
import { first, mergeMap } from 'rxjs/operators';

@Injectable()
export class FCMService {
  private fcmTokenSubscription: Subscription;
  private fcmMessageSubscription: Subscription;

  constructor(
    private afMessaging: AngularFireMessaging,
    private auth: AuthenticationManager,
    private notificationService: NotificationService,
    private router: Router,
    private ngZone: NgZone,
    @Inject(DOCUMENT) private document: Document
  ) {
    auth.currentUser$.subscribe((user) => this.onUserChange(user));
  }

  private onUserChange(user: User): void {
    if (user) {
      if (user.role !== 'Proband') {
        return;
      }
      try {
        this.fcmTokenSubscription = this.afMessaging.requestToken.subscribe(
          (token) => {
            if (token) {
              console.log('[FCM] got new token');
              this.notificationService.postFCMToken(token);
            } else {
              console.log('[FCM] not active');
            }
          },
          (error) => console.error(error)
        );
        this.fcmMessageSubscription = this.afMessaging.messages.subscribe(
          (message) => this.handleFCMMessage(message)
        );
      } catch (e) {
        console.error('[FCM] could not be initialized', e);
      }
    } else {
      if (this.fcmTokenSubscription) {
        this.fcmTokenSubscription.unsubscribe();
      }
      if (this.fcmMessageSubscription) {
        this.fcmMessageSubscription.unsubscribe();
      }
      this.deleteToken();
    }
  }

  private deleteToken(): void {
    this.afMessaging.getToken
      .pipe(first())
      .pipe(mergeMap((token) => this.afMessaging.deleteToken(token)))
      .subscribe(() => console.log('[FCM] token deleted'));
  }

  private handleFCMMessage(payload): void {
    console.log('Received message', payload);
    const notificationOptions: NotificationOptions = {
      body: payload.notification.body,
      icon: '/assets/images/pia_logo.png',
      requireInteraction: true,
    };
    const notification = new this.document.defaultView.Notification(
      payload.notification.title,
      notificationOptions
    );
    notification.onclick = () =>
      this.ngZone.run(() =>
        this.router.navigate(['/home'], {
          queryParams: { notification_id: payload.data.id },
        })
      );
  }
}
