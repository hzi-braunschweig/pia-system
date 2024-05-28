/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';
import { Study } from '../../psa.app.core/models/study';
import { AlertService } from '../../_services/alert.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { ProfessionalUser } from '../../psa.app.core/models/user';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'new-user-dialog',
  templateUrl: 'new-user-dialog.component.html',
  styleUrls: ['new-user-dialog.component.scss'],
})
export class DialogNewUserComponent implements OnInit {
  public form: FormGroup;
  private studies: Study[] = [];
  public studyFilterCtrl: FormControl = new FormControl();
  public filteredStudies: ReplaySubject<Study[]> = new ReplaySubject<Study[]>(
    1
  );
  public showError: boolean;
  public showErrorEmpty: boolean;

  public readonly roles = [
    { value: 'Forscher', viewValue: 'ROLES.RESEARCHER' },
    { value: 'ProbandenManager', viewValue: 'ROLES.PROBANDS_MANAGER' },
    { value: 'EinwilligungsManager', viewValue: 'ROLES.COMPLIANCE_MANAGER' },
    { value: 'Untersuchungsteam', viewValue: 'ROLES.RESEARCH_TEAM' },
  ];

  public readonly accesses = [
    { value: 'read', viewValue: 'DIALOG.READ' },
    { value: 'write', viewValue: 'DIALOG.WRITE' },
    { value: 'admin', viewValue: 'DIALOG.ADMIN' },
  ];

  constructor(
    public dialogRef: MatDialogRef<DialogNewUserComponent>,
    private authService: AuthService,
    private alertService: AlertService,
    private userService: UserService
  ) {
    this.userService.getStudies().then(
      (result) => {
        result.forEach((study) => {
          if (study.status !== 'deleted') {
            this.studies.push(study);
          }
        });
        this.filteredStudies.next(this.studies.slice());
      },
      (err) => {
        this.alertService.errorObject(err);
      }
    );
  }

  public ngOnInit(): void {
    const study_accesses = new FormArray([]);

    this.form = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.email]),
      role: new FormControl('', Validators.required),
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

  public addStudyAccess(study_access?: any): void {
    const study_id = study_access ? study_access.study_id : null;
    const access_level = study_access ? study_access.accessLevel : null;
    (this.form.get('study_accesses') as FormArray).push(
      new FormGroup({
        study_id: new FormControl(study_id),
        access_level: new FormControl(access_level),
      })
    );
  }

  public removeStudyAccess(studyIndex: number): void {
    // remove AnswerOption from the list
    this.showError = false;
    this.showErrorEmpty = false;
    const control = this.form.get('study_accesses') as FormArray;
    control.removeAt(studyIndex);
  }

  public checkIfArrayIsUnique(): boolean {
    const studyArray: Array<string> = [];
    this.form.get('study_accesses').value.forEach((study_acces) => {
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
      while ((this.form.get('study_accesses') as FormArray).length) {
        (this.form.get('study_accesses') as FormArray).removeAt(0);
      }
      return true;
    }
  }

  public submit(): void {
    const user: ProfessionalUser = this.form.value;
    this.authService
      .postUser(user)
      .then(() => {
        this.dialogRef.close(user);
      })
      .catch((err) => {
        this.alertService.errorObject(err);
      });
  }
}
