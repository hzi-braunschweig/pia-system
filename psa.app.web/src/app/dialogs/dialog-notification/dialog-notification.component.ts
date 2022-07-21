/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationDto } from '../../psa.app.core/models/notification';

@Component({
  selector: 'dialog-notification',
  templateUrl: 'dialog-notification.component.html',
})
export class DialogNotificationComponent {
  constructor(
    public readonly dialogRef: MatDialogRef<
      DialogNotificationComponent,
      string
    >,
    @Inject(MAT_DIALOG_DATA) public readonly notification: NotificationDto
  ) {}

  public confirmSelection(): void {
    this.dialogRef.close('ok');
  }

  public cancel(): void {
    this.dialogRef.close();
  }
}
