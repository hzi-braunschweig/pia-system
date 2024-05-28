/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-dialog-delete',
  template: `
    <mat-dialog-content>{{
      'DIALOG.DELETE' | translate: data
    }}</mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onNoClick()">
        {{ 'DIALOG.CANCEL' | translate }}
      </button>
      <!-- Can optionally provide a result for the closing dialog. -->
      <button
        id="confirmbutton"
        mat-button
        color="primary"
        (click)="confirmSelection()"
      >
        {{ 'DIALOG.YES' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  imports: [MatDialogModule, TranslateModule, MatButtonModule],
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
