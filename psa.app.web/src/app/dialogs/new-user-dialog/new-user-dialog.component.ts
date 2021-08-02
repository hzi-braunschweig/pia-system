/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { Studie } from '../../psa.app.core/models/studie';
import { AlertService } from '../../_services/alert.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { UserWithStudyAccess } from '../../psa.app.core/models/user-with-study-access';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../../psa.app.core/models/user';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'new-user-dialog',
  templateUrl: 'new-user-dialog.component.html',
})
export class DialogNewUserComponent implements OnInit {
  form: FormGroup;
  studies: Studie[] = [];
  user: UserWithStudyAccess;
  currentRole: string;
  public studyFilterCtrl: FormControl = new FormControl();
  public filteredStudies: ReplaySubject<Studie[]> = new ReplaySubject<Studie[]>(
    1
  );
  showError: boolean;
  showErrorEmpty: boolean;

  roles = [
    { value: 'Forscher', viewValue: 'ROLES.RESEARCHER' },
    { value: 'ProbandenManager', viewValue: 'ROLES.PROBANDS_MANAGER' },
    { value: 'EinwilligungsManager', viewValue: 'ROLES.COMPLIANCE_MANAGER' },
    { value: 'Untersuchungsteam', viewValue: 'ROLES.RESEARCH_TEAM' },
  ];

  accesses = [
    { value: 'read', viewValue: 'DIALOG.READ' },
    { value: 'write', viewValue: 'DIALOG.WRITE' },
    { value: 'admin', viewValue: 'DIALOG.ADMIN' },
  ];

  constructor(
    public dialogRef: MatDialogRef<DialogNewUserComponent>,
    private authService: AuthService,
    private alertService: AlertService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private questionnaireService: QuestionnaireService
  ) {
    this.questionnaireService.getStudies().then(
      (result: any) => {
        result.studies.forEach((study) => {
          if (study.status !== 'deleted') {
            this.studies.push(study);
          }
        });
        this.filteredStudies.next(this.studies.slice());
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
    const username = this.user ? this.user.username : '';
    const role = this.user ? this.user.role : '';
    const study_accesses = new FormArray([]);

    this.form = new FormGroup({
      username: new FormControl(username, [
        Validators.required,
        Validators.email,
      ]),
      role: new FormControl(role, Validators.required),
      study_accesses,
    });
    this.addStudyAccess();
    this.studyFilterCtrl.valueChanges.subscribe(() => {
      this.filterStudies();
    });
  }

  private filterStudies(): void {
    this.filteredStudies.next(this.studies);
    if (!this.studies) {
      return;
    }
    // get the search keyword
    let search = this.studyFilterCtrl.value;
    if (!search) {
      this.filteredStudies.next(this.studies);
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the users
    this.filteredStudies.next(
      this.studies.filter(
        (study) => study.name.toLowerCase().indexOf(search) > -1
      )
    );
  }

  onChange(option: HTMLOptionElement, studyIndex: number): void {
    const selectedStudy: string = (
      (
        (this.form.controls['study_accesses'] as FormArray).controls[
          studyIndex
        ] as FormGroup
      ).controls['study_id'] as FormArray
    ).value;

    const index = this.studies.findIndex(
      (study) => study.name === selectedStudy
    );
    this.studies.splice(index, 1);
    this.filteredStudies.next(this.studies);
  }

  addStudyAccess(study_access?: any): void {
    const study_id = study_access ? study_access.study_id : null;
    const access_level = study_access ? study_access.access_level : null;
    (this.form.controls['study_accesses'] as FormArray).push(
      new FormGroup({
        study_id: new FormControl(study_id),
        access_level: new FormControl(access_level),
      })
    );
  }

  removeStudyAccess(studyIndex: number): void {
    // remove AnswerOption from the list
    this.showError = false;
    this.showErrorEmpty = false;
    const control = this.form.controls['study_accesses'] as FormArray;
    control.removeAt(studyIndex);
  }

  checkIfArrayIsUnique(): boolean {
    const studyArray: Array<string> = [];
    const study_accesses_value = this.form.controls['study_accesses'].value;
    const study_id_value = (
      (
        (this.form.controls['study_accesses'] as FormArray)
          .controls[0] as FormGroup
      ).controls['study_id'] as FormArray
    ).value;
    this.form.controls['study_accesses'].value.forEach((study_acces) => {
      if (study_acces.study_id != null) {
        studyArray.push(study_acces.study_id);
      } else {
        this.showErrorEmpty = true;
      }
    });
    if (studyArray.length !== 0) {
      if (this.showErrorEmpty === true) {
        return false;
      } else {
        if (studyArray.length !== new Set(studyArray).size) {
          this.showError = true;
        }
        return studyArray.length === new Set(studyArray).size;
      }
    } else {
      this.showErrorEmpty = false;
      while ((this.form.controls['study_accesses'] as FormArray).length) {
        (this.form.controls['study_accesses'] as FormArray).removeAt(0);
      }
      return true;
    }
  }

  submit(form): void {
    this.user = form.value;
    this.authService.postUser(this.user).then(
      (result: any) => {
        this.user = result;
        this.dialogRef.close(this.user);
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );
  }
}
