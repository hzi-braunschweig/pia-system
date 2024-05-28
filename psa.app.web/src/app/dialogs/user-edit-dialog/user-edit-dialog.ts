/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../_services/alert.service';
import { AccessLevel } from '../../psa.app.core/models/studyAccess';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';

export interface DialogUserEditComponentData {
  accessLevel: AccessLevel;
  username: string;
  studyName: string;
}
export type DialogUserEditComponentReturn = boolean;

@Component({
  selector: 'dialog-user-edit',
  templateUrl: 'user-edit-dialog.html',
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
    private alertService: AlertService,
    private userService: UserService
  ) {
    this.studyName = data.studyName;
    this.username = data.username;
    this.form = new FormGroup({
      accessLevel: new FormControl(data.accessLevel, Validators.required),
    });
  }

  public async submit(): Promise<void> {
    try {
      await this.userService.putStudyAccess({
        username: this.username,
        studyName: this.studyName,
        accessLevel: this.form.get('accessLevel').value as AccessLevel,
      });
      this.dialogRef.close(true);
    } catch (err) {
      this.alertService.errorObject(err);
    }
  }
}
