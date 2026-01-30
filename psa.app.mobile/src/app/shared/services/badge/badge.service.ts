/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { Badge } from '@capawesome/capacitor-badge';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class BadgeService {
  constructor(private readonly platform: Platform) {}

  async set(count: number) {
    if (this.platform.is('hybrid')) {
      await this.platform.ready();
      await Badge.set({ count });
    }
  }

  async clear() {
    if (this.platform.is('hybrid')) {
      await this.platform.ready();
      await Badge.clear();
    }
  }
}
