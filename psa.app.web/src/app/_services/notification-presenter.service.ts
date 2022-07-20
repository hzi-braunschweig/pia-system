/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NotificationDto } from '../psa.app.core/models/notification';
import { CurrentUser } from './current-user.service';
import { filter } from 'rxjs/operators';
import { DialogNotificationComponent } from '../dialogs/dialog-notification/dialog-notification.component';

@Injectable()
export class NotificationPresenter {
  constructor(
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly user: CurrentUser
  ) {}

  public present(notification: NotificationDto): void {
    this.dialog
      .open(DialogNotificationComponent, {
        width: '500px',
        data: notification,
      })
      .afterClosed()
      .pipe(filter((result) => result === 'ok'))
      .subscribe(() => this.navigateToTarget(notification));
  }

  private navigateToTarget(notification: NotificationDto): void {
    if (notification.notification_type === 'qReminder') {
      this.router.navigate([
        '/questionnaire',
        notification.questionnaire_id,
        notification.reference_id,
      ]);
    } else if (notification.notification_type === 'sample') {
      this.router.navigate([
        ['/laboratory-results', notification.reference_id],
        {
          queryParams: { user_id: this.user.username },
        },
      ]);
    }
  }
}
