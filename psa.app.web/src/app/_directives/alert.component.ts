/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { AlertMessage, AlertService } from '../_services/alert.service';

@Component({
  selector: 'app-alert',
  templateUrl: 'alert.component.html',
  styleUrls: ['alert.component.scss'],
})
export class AlertComponent implements OnDestroy {
  private subscription: Subscription;
  message: AlertMessage;

  constructor(private alertService: AlertService) {
    // subscribe to alert messages
    this.subscription = alertService.getMessage().subscribe((message) => {
      this.message = message;
    });
  }

  ngOnDestroy(): void {
    // unsubscribe on destroy to prevent memory leaks
    this.subscription.unsubscribe();
  }
}
