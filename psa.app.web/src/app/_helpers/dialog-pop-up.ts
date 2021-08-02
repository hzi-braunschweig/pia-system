/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

export interface DialogPopUpData {
  content: string;
  values?: object;
  isSuccess: boolean;
}

@Component({
  selector: 'app-dialog-pop-up',
  template: `
    <h1 mat-dialog-title style=" display: flex; justify-content: center; ">
      <button disabled mat-icon-button style="margin:10px;margin-right:90px;">
        <mat-icon
          style="font-size: 100px; color:#7aa228;"
          *ngIf="data.isSuccess"
          >check_circle</mat-icon
        >
        <mat-icon
          style="font-size: 100px; color:#7dd4ff;"
          *ngIf="!data.isSuccess"
          >cancel</mat-icon
        >
      </button>
    </h1>
    <mat-dialog-content>{{
      data.content | translate: data.values
    }}</mat-dialog-content>
    <hr />
    <mat-dialog-actions align="center">
      <button id="confirmbutton" mat-button [mat-dialog-close]>OK</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        white-space: pre-wrap;
      }
    `,
  ],
})
export class DialogPopUpComponent {
  constructor(
    public translate: TranslateService,
    public dialogRef: MatDialogRef<DialogPopUpComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogPopUpData
  ) {}
}
