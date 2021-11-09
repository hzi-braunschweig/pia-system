/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable, NgZone } from '@angular/core';
import { NotificationService } from '../psa.app.core/providers/notification-service/notification-service';
import firebase from 'firebase/app';
import 'firebase/messaging';
import { AuthenticationManager } from './authentication-manager.service';
import { Router } from '@angular/router';
import Messaging = firebase.messaging.Messaging;

@Injectable()
export class FCMService {
  private messaging: Messaging;
  private fcmSuccessfullyInitialized = false;

  constructor(
    private auth: AuthenticationManager,
    private notificationService: NotificationService,
    private router: Router,
    private ngZone: NgZone
  ) {
    if (auth.currentRole !== 'Proband') {
      // init fcm only for probands
      return;
    }
    const firebaseConfig = {
      apiKey: 'AIzaSyDf4H-r-iDYG1lVtlDQXs2xJTmvDT4lzV0',
      authDomain: 'pia-app-c50e8.firebaseapp.com',
      projectId: 'pia-app-c50e8',
      storageBucket: 'pia-app-c50e8.appspot.com',
      messagingSenderId: '1012552142126',
      appId: '1:1012552142126:web:1cdd40ece476ebfea83ebf',
    };
    try {
      firebase.initializeApp(firebaseConfig);
      this.messaging = firebase.messaging();
      this.messaging.onMessage((message) => this.handleFCMMessage(message));

      auth.currentUserObservable.subscribe((user) => {
        if (user) {
          this.getTokenFromFCMToService();
        } else {
          this.messaging.deleteToken();
        }
      });
      this.fcmSuccessfullyInitialized = true;
    } catch (e) {
      console.error('Firebase Cloud Messaging could not be initialized', e);
      this.fcmSuccessfullyInitialized = false;
    }
  }

  private handleFCMMessage(payload): void {
    console.log('Received message', payload);
    const notificationOptions: NotificationOptions = {
      body: payload.notification.body,
      icon: '/assets/images/pia_logo.png',
      requireInteraction: true,
    };
    const notification = new Notification(
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

  private getTokenFromFCMToService(): void {
    this.messaging
      .getToken({
        vapidKey:
          'BIYVU_3SGxao99eC0FwrtDKe-JV51ENGAf_W2oaoeYMDuLX0av2IMCzSVHELHSs42wfac3swmGclhSp6R9IGfIo',
      })
      .then((token) => this.notificationService.postFCMToken(token))
      .catch(console.log);
  }
}
