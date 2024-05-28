/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';

export interface DialogOkCancelComponentData {
  q?: string;
  content: string;
}
export type DialogOkCancelComponentReturn = 'ok';

@Component({
  selector: 'dialog-ok-cancel',
  standalone: true,
  template: `
    <h1 *ngIf="data.q" mat-dialog-title>{{ data.q | translate }}</h1>
    <div mat-dialog-content>{{ data.content | translate }}</div>
    <mat-dialog-actions>
      <button
        id="cancelButton"
        data-e2e="dialog-button-cancel"
        mat-button
        (click)="cancel()"
      >
        {{ 'GENERAL.CANCEL' | translate }}
      </button>
      <button
        id="confirmButton"
        mat-button
        cdkFocusInitial
        color="primary"
        (click)="confirmSelection()"
        data-e2e="dialog-button-accept"
      >
        {{ 'GENERAL.OK' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  imports: [CommonModule, TranslateModule, MatDialogModule, MatButtonModule],
})
export class DialogOkCancelComponent {
  constructor(
    public translate: TranslateService,
    public dialogRef: MatDialogRef<
      DialogOkCancelComponent,
      DialogOkCancelComponentReturn
    >,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogOkCancelComponentData
  ) {}

  confirmSelection(): void {
    this.dialogRef.close('ok');
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
