/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../_services/alert.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { AccessLevel } from '../../psa.app.core/models/study_access';

export interface DialogUserEditComponentData {
  accessLevel: AccessLevel;
  username: string;
  studyName: string;
}
export type DialogUserEditComponentReturn = boolean;

@Component({
  selector: 'dialog-user-edit',
  templateUrl: 'user-edit-dialog.html',
  styleUrls: ['user-edit-dialog.scss'],
})
export class DialogUserEditComponent {
  private studyName: string;
  public form: FormGroup;
  public username: string;
  public accesses = [
    { value: 'read', viewValue: 'DIALOG.READ' },
    { value: 'write', viewValue: 'DIALOG.WRITE' },
    { value: 'admin', viewValue: 'DIALOG.ADMIN' },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) data: DialogUserEditComponentData,
    public dialogRef: MatDialogRef<
      DialogUserEditComponent,
      DialogUserEditComponentReturn
    >,
    private authService: AuthService,
    private alertService: AlertService,
    private questionnaireService: QuestionnaireService
  ) {
    this.studyName = data.studyName;
    this.username = data.username;
    this.form = new FormGroup({
      accessLevel: new FormControl(data.accessLevel, Validators.required),
    });
  }

  public submit(): void {
    const access_level = { access_level: this.form.value.accessLevel };
    this.questionnaireService
      .putStudyAccess(this.username, access_level, this.studyName)
      .then(() => {
        this.dialogRef.close(true);
      })
      .catch((err) => {
        this.alertService.errorObject(err);
      });
  }
}
