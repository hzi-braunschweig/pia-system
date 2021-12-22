/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../_services/alert.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { Observable } from 'rxjs';
import {
  DialogOkCancelComponent,
  DialogOkCancelComponentData,
  DialogOkCancelComponentReturn,
} from 'src/app/_helpers/dialog-ok-cancel';
import { TranslateService } from '@ngx-translate/core';
import { ProfessionalUser } from '../../psa.app.core/models/user';
import { map, shareReplay, startWith } from 'rxjs/operators';

export interface DialogUserStudyAccessComponentData {
  studyName: string;
}
export type DialogUserStudyAccessComponentReturn = boolean;

export interface ProfessionalUserWithStudyNamesArray extends ProfessionalUser {
  studyNamesArray?: string[];
}

@Component({
  selector: 'dialog-user-study',
  templateUrl: 'user-study-dialog.html',
})
export class DialogUserStudyAccessComponent implements OnInit {
  public form: FormGroup = new FormGroup({
    user_id: new FormControl(null, Validators.required),
    access_level: new FormControl(null, Validators.required),
  });
  public usernameFilterCtrl: FormControl = new FormControl('');
  public filteredUsers: Observable<ProfessionalUserWithStudyNamesArray[]>;
  private studyName: string;

  public readonly accesses = [
    { value: 'read', viewValue: 'DIALOG.READ' },
    { value: 'write', viewValue: 'DIALOG.WRITE' },
    { value: 'admin', viewValue: 'DIALOG.ADMIN' },
  ];

  public constructor(
    @Inject(MAT_DIALOG_DATA) data: DialogUserStudyAccessComponentData,
    public dialogRef: MatDialogRef<
      DialogUserStudyAccessComponent,
      DialogUserStudyAccessComponentReturn
    >,
    private authService: AuthService,
    private alertService: AlertService,
    private questionnaireService: QuestionnaireService,
    private matDialog: MatDialog,
    private translate: TranslateService
  ) {
    this.studyName = data.studyName;
  }

  public async ngOnInit(): Promise<void> {
    try {
      const allUsers = await this.authService.getProfessionalUsers();
      const usersOutsideStudy = allUsers
        .map((user) => ({
          ...user,
          studyNamesArray: user.study_accesses.map(
            (studyaccess) => studyaccess.study_id
          ),
        }))
        .filter(
          (user) =>
            user.studyNamesArray === undefined ||
            !user.studyNamesArray.includes(this.studyName)
        );

      this.filteredUsers = this.createUsersFilterObservable(usersOutsideStudy);
    } catch (err) {
      this.alertService.errorObject(err);
    }
  }

  private createUsersFilterObservable(
    users: ProfessionalUserWithStudyNamesArray[]
  ): Observable<ProfessionalUserWithStudyNamesArray[]> {
    return this.usernameFilterCtrl.valueChanges.pipe(
      startWith(this.usernameFilterCtrl.value as string),
      map((filterValue) => filterValue.toLowerCase()),
      map((filterValue) => {
        if (!filterValue) {
          return users;
        } else {
          return users.filter((user) =>
            user.username.toLowerCase().includes(filterValue)
          );
        }
      }),
      shareReplay(1)
    );
  }

  public submit(): void {
    const dialogRef = this.matDialog.open<
      DialogOkCancelComponent,
      DialogOkCancelComponentData,
      DialogOkCancelComponentReturn
    >(DialogOkCancelComponent, {
      width: '450px',
      data: {
        content: this.translate.instant('DIALOG.CONFIRM_STUDY_ACCESS', {
          user: this.form.value.user_id,
          study: this.studyName,
        }),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'ok') {
        this.questionnaireService
          .postStudyAccess(this.studyName, this.form.value)
          .then(() => {
            this.dialogRef.close(true);
          })
          .catch((err) => {
            this.alertService.errorObject(err);
          });
      }
    });
  }
}
