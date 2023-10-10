/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { TranslateService } from '@ngx-translate/core';
import { ProfessionalUser } from '../psa.app.core/models/user';

@Component({
  selector: 'dialog-user-data',
  template: `
    <mat-dialog-content style="	text-align: left;margin-bottom:15px">{{
      'STUDIES.PROBAND_DATA' | translate
    }}</mat-dialog-content>
    <ul style="font-size:14px;	text-align: left">
      <li>{{ 'LOGIN.USERNAME' | translate }}: {{ data.username }}</li>
      <li>{{ 'QUESTIONNAIRES_FORSCHER.ROLE' | translate }}: {{ data.role }}</li>
      <li>{{ 'DIALOG.ACCESS_LEVEL' | translate }}:</li>
      <ul
        *ngFor="let acces_level of this.accessLevel"
        style="font-size:14px;	text-align: left"
      >
        <li>{{ this.accessLevel ? acces_level : '' }}</li>
      </ul>
    </ul>
    <hr />
    <mat-dialog-actions align="end">
      <button id="confirmbutton" mat-button mat-dialog-close>OK</button>
    </mat-dialog-actions>
  `,
})
export class DialogUserDataComponent {
  public accessLevel: string[] = [''];

  constructor(
    public translate: TranslateService,
    public dialogRef: MatDialogRef<DialogUserDataComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProfessionalUser
  ) {
    if (data.study_accesses && data.study_accesses.length) {
      this.accessLevel = data.study_accesses.map((studyAccess) => {
        let accessLevel = studyAccess.study_id + '(';
        if (studyAccess.access_level === 'read') {
          accessLevel += this.translate.instant('DIALOG.READ');
        } else if (studyAccess.access_level === 'write') {
          accessLevel += this.translate.instant('DIALOG.WRITE');
        } else if (studyAccess.access_level === 'admin') {
          accessLevel += this.translate.instant('DIALOG.ADMIN');
        }
        accessLevel += ')';
        return accessLevel;
      });
    }
  }
}
