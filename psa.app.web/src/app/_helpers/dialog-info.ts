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
  selector: 'dialog-info',
  standalone: true,
  template: `
    <h1 mat-dialog-title style=" display: flex; justify-content: center; "></h1>
    <div mat-dialog-content>
      {{ data.content | translate }}
    </div>
    <hr />
    <mat-dialog-actions>
      <button id="confirmbutton" mat-button (click)="confirmSelection()">
        OK
      </button>
    </mat-dialog-actions>
  `,
  imports: [MatDialogModule, MatButtonModule, TranslateModule],
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
