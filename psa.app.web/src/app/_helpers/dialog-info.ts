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
import { TranslateModule } from '@ngx-translate/core';
import { MatLegacyButtonModule } from '@angular/material/legacy-button';

@Component({
  selector: 'dialog-info',
  standalone: true,
  template: `
    <h1 mat-dialog-title style=" display: flex; justify-content: center; "></h1>
    <div mat-dialog-content>
      {{ data.content | translate }}
    </div>
    <hr />
    <mat-dialog-actions align="center">
      <button id="confirmbutton" mat-button (click)="confirmSelection()">
        OK
      </button>
    </mat-dialog-actions>
  `,
  imports: [MatLegacyDialogModule, MatLegacyButtonModule, TranslateModule],
})
export class DialogInfoComponent {
  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmSelection(): void {
    this.dialogRef.close();
  }
}
