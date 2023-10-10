/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogModule,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatLegacyButtonModule } from '@angular/material/legacy-button';

export interface DialogOkCancelComponentData {
  q?: string;
  content: string;
}
export type DialogOkCancelComponentReturn = 'ok';

@Component({
  selector: 'dialog-ok-cancel',
  standalone: true,
  template: `
    <h1 mat-dialog-title style=" display: flex; justify-content: center; ">
      {{ data.q | translate }}
    </h1>
    <div mat-dialog-content>
      {{ data.content | translate }}
    </div>
    <hr />
    <mat-dialog-actions align="center">
      <button id="cancelButton" mat-raised-button (click)="cancel()">
        {{ 'GENERAL.CANCEL' | translate }}
      </button>
      <button
        id="confirmButton"
        mat-raised-button
        color="primary"
        (click)="confirmSelection()"
      >
        {{ 'GENERAL.OK' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  imports: [TranslateModule, MatLegacyDialogModule, MatLegacyButtonModule],
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
