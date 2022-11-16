/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

export interface DialogPopUpData {
  content: string;
  values?: object;
  isSuccess: boolean;
}

@Component({
  selector: 'app-dialog-pop-up',
  template: `
    <div
      style="display: flex; justify-content: center; font-size: 80px; margin-bottom: 25px;"
    >
      <mat-icon [inline]="true" style="color:#7aa228;" *ngIf="data.isSuccess">
        check_circle
      </mat-icon>
      <mat-icon [inline]="true" style="color:#f44336;" *ngIf="!data.isSuccess">
        cancel
      </mat-icon>
    </div>
    <mat-dialog-content>
      {{ data.content | translate: data.values }}
    </mat-dialog-content>
    <mat-dialog-actions align="center">
      <button mat-button color="primary" [mat-dialog-close] id="confirmbutton">
        OK
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogPopUpComponent {
  constructor(
    public translate: TranslateService,
    public dialogRef: MatDialogRef<DialogPopUpComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogPopUpData
  ) {}
}
