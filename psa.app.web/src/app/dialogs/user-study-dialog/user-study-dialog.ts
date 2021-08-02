/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../_services/alert.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { UserWithStudyAccess } from '../../psa.app.core/models/user-with-study-access';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../../psa.app.core/models/user';
import { ReplaySubject } from 'rxjs';
import { StudyAccess } from '../../psa.app.core/models/study_access';
import { DialogOkCancelComponent } from 'src/app/_helpers/dialog-ok-cancel';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'dialog-user-study',
  templateUrl: 'user-study-dialog.html',
})
export class DialogUserStudyAccessComponent implements OnInit {
  form: FormGroup;
  users: UserWithStudyAccess[];
  currentRole: string;
  public usernameFilterCtrl: FormControl = new FormControl();
  public filteredUsers: ReplaySubject<UserWithStudyAccess[]> =
    new ReplaySubject<UserWithStudyAccess[]>(1);
  studyAccess: StudyAccess;
  study_name: string;

  accesses = [
    { value: 'read', viewValue: 'DIALOG.READ' },
    { value: 'write', viewValue: 'DIALOG.WRITE' },
    { value: 'admin', viewValue: 'DIALOG.ADMIN' },
  ];

  usersOutsideStudy = [];

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<DialogUserStudyAccessComponent>,
    private authService: AuthService,
    private alertService: AlertService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private questionnaireService: QuestionnaireService,
    private matDialog: MatDialog,
    private translate: TranslateService
  ) {
    this.study_name = data.data.toString();
    this.authService.getUsers().then(
      (result: any) => {
        this.users = result.users;
        this.users.forEach((user, userIndex) => {
          user.studyNamesArray = [];
          user.study_accesses.forEach((studyaccess, studyaccessIndex) => {
            user.studyNamesArray.push(studyaccess.study_id);
          });

          if (
            user.studyNamesArray === undefined ||
            !user.studyNamesArray.includes(this.study_name)
          ) {
            this.usersOutsideStudy.push(user);
          }
          this.filteredUsers.next(this.usersOutsideStudy.slice());
        });
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );

    const jwtHelper: JwtHelperService = new JwtHelperService();
    const currentUser: User = JSON.parse(localStorage.getItem('currentUser'));
    const tokenPayload = jwtHelper.decodeToken(currentUser.token);
    this.currentRole = tokenPayload.role;
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      user_id: new FormControl(null, Validators.required),
      access_level: new FormControl(null, Validators.required),
    });

    this.usernameFilterCtrl.valueChanges.subscribe(() => {
      this.filterUsers();
    });
  }

  private filterUsers(): void {
    this.filteredUsers.next(this.usersOutsideStudy);
    if (!this.usersOutsideStudy) {
      return;
    }
    let search = this.usernameFilterCtrl.value;
    if (!search) {
      this.filteredUsers.next(this.usersOutsideStudy.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    this.filteredUsers.next(
      this.usersOutsideStudy.filter(
        (user) => user.username.toLowerCase().indexOf(search) > -1
      )
    );
  }

  checkRole(role: string): void {
    if (role === 'Proband') {
      this.form.controls['access_level'].setValue('read');
      this.form.controls['access_level'].disable();
    } else {
      this.form.controls['access_level'].reset();
      this.form.controls['access_level'].enable();
    }
  }

  submit(form): void {
    this.form.controls['access_level'].enable();

    const dialogRef = this.matDialog.open(DialogOkCancelComponent, {
      width: '250px',
      data: {
        content: this.translate.instant('DIALOG.CONFIRM_STUDY_ACCESS', {
          user: form.value.user_id,
          study: this.study_name,
        }),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'ok') {
        this.questionnaireService
          .postStudyAccess(this.study_name, form.value)
          .then(
            (studyAccess: any) => {
              this.studyAccess = studyAccess;
              this.dialogRef.close(this.studyAccess);
            },
            (err: any) => {
              this.alertService.errorObject(err);
            }
          );
      }
    });
  }
}
