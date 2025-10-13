/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Inject, Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';

import { NotificationService } from '../psa.app.core/providers/notification-service/notification-service';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, first, mergeMap, tap } from 'rxjs/operators';
import { CurrentUser } from './current-user.service';

@Injectable()
export class FCMService implements OnDestroy {
  private fcmTokenSubscription: Subscription;
  private fcmMessageSubscription: Subscription;

  public constructor(
    private readonly afMessaging: AngularFireMessaging,
    private readonly user: CurrentUser,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
    private readonly ngZone: NgZone,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    if (this.user.isProband()) {
      this.subscribeToPushNotifications();
    }
  }

  public ngOnDestroy(): void {
    this.fcmTokenSubscription?.unsubscribe();
    this.fcmMessageSubscription?.unsubscribe();
  }

  public async onLogout(): Promise<boolean> {
    if (this.user.isProband()) {
      return this.deleteToken().toPromise();
    } else {
      return Promise.resolve(false);
    }
  }

  private subscribeToPushNotifications(): void {
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
    notification.onclick = async () =>
      this.ngZone.run(async () =>
        this.router.navigate(['/home'], {
          queryParams: { notification_id: payload.data.id },
        })
      );
  }

  private deleteToken(): Observable<boolean> {
    return this.afMessaging.getToken.pipe(
      first(),
      mergeMap((token) => this.afMessaging.deleteToken(token)),
      tap(() => console.log('[FCM] token deleted')),
      catchError((err) => {
        console.error('Could not delete FCM token on logout', err);
        return of(false);
      })
    );
  }
}
