/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../_services/alert.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { StudyAccess } from '../../psa.app.core/models/study_access';

@Component({
  selector: 'dialog-user-edit',
  templateUrl: 'user-edit-dialog.html',
  styleUrls: ['user-edit-dialog.scss'],
})
export class DialogUserEditComponent implements OnInit {
  form: FormGroup;
  studyAccess: StudyAccess;
  study_name: string;
  username: string;

  accesses = [
    { value: 'read', viewValue: 'DIALOG.READ' },
    { value: 'write', viewValue: 'DIALOG.WRITE' },
    { value: 'admin', viewValue: 'DIALOG.ADMIN' },
  ];

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<DialogUserEditComponent>,
    private authService: AuthService,
    private alertService: AlertService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private questionnaireService: QuestionnaireService
  ) {
    this.study_name = data.data.toString();
    this.username = data.user.user_id;
  }

  ngOnInit(): void {
    let access_level = this.data.user ? this.data.user.access_level : null;
    if (access_level === 'DIALOG.READ') {
      access_level = 'read';
    } else if (access_level === 'DIALOG.WRITE') {
      access_level = 'write';
    } else if (access_level === 'DIALOG.ADMIN') {
      access_level = 'admin';
    }
    this.form = new FormGroup({
      access_level: new FormControl(access_level, Validators.required),
    });
  }

  submit(form): void {
    const access_level = { access_level: form.value.access_level };
    this.questionnaireService
      .putStudyAccess(this.username, access_level, this.study_name)
      .then(
        (result: any) => {
          this.studyAccess = result;
          this.dialogRef.close(this.studyAccess);
        },
        (err: any) => {
          this.alertService.errorObject(err);
        }
      );
  }
}
