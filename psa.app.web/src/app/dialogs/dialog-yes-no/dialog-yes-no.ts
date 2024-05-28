/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-dialog-yes-no',
  template: `
    <h1 mat-dialog-title [innerHTML]="data.content | translate"></h1>
    <div mat-dialog-content></div>
    <div mat-dialog-actions>
      <button id="confirmButton" mat-button mat-dialog-close="yes">
        {{ 'GENERAL.YES' | translate }}
      </button>
      <button id="cancelButton" mat-button mat-dialog-close>
        {{ 'GENERAL.NO' | translate }}
      </button>
    </div>
  `,
  imports: [CommonModule, MatDialogModule, MatButtonModule, TranslateModule],
})
export class DialogYesNoComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { content: string }) {}
}
