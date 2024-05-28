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
  showLinebreaks?: boolean;
}

@Component({
  selector: 'app-dialog-pop-up',
  styles: [
    `
      .mat-mdc-dialog-content {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .show-linebreaks {
        white-space: pre-line;
      }

      .mat-icon {
        display: block;
        font-size: 80px;
        width: 80px;
        height: 80px;
      }
    `,
  ],
  template: `
    <mat-dialog-content class="space-y">
      <mat-icon style="color:#7aa228;" *ngIf="data.isSuccess">
        check_circle
      </mat-icon>
      <mat-icon style="color:#f44336;" *ngIf="!data.isSuccess">
        cancel
      </mat-icon>
      <p class="mat-body" [class.show-linebreaks]="data.showLinebreaks">
        {{ data.content | translate: data.values }}
      </p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close color="primary" id="confirmbutton">
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
