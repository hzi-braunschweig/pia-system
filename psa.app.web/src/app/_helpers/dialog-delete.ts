/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'dialog-delete',
  template: `
    <mat-dialog-content style="	text-align: left">{{
      'DIALOG.DELETE' | translate: data
    }}</mat-dialog-content>
    <hr />
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">
        {{ 'DIALOG.CANCEL' | translate }}
      </button>
      <!-- Can optionally provide a result for the closing dialog. -->
      <button
        id="confirmbutton"
        mat-raised-button
        color="primary"
        (click)="confirmSelection()"
      >
        {{ 'DIALOG.YES' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogDeleteComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  confirmSelection(): void {
    this.dialogRef.close(true);
  }
}
