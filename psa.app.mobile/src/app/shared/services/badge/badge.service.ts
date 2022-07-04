/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { FirebaseX } from '@awesome-cordova-plugins/firebase-x/ngx';

@Injectable({
  providedIn: 'root',
})
export class BadgeService {
  constructor(private firebaseX: FirebaseX) {}

  set(count: number): void {
    this.firebaseX.setBadgeNumber(count);
  }

  clear() {
    this.firebaseX.setBadgeNumber(0);
    this.firebaseX.clearAllNotifications();
  }
}
