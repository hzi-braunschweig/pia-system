/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'dialog-yes-no',
  template: `
    <h1
      mat-dialog-title
      style=" display: flex; justify-content: center; "
      [innerHTML]="data.content | translate"
    ></h1>
    <div mat-dialog-content></div>
    <hr />
    <mat-dialog-actions align="center">
      <button id="confirmButton" mat-button (click)="confirmSelection()">
        {{ 'GENERAL.YES' | translate }}
      </button>
      <button id="cancelButton" mat-button (click)="cancel()">
        {{ 'GENERAL.NO' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogYesNoComponent {
  constructor(
    public translate: TranslateService,
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmSelection(): void {
    this.dialogRef.close('yes');
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
