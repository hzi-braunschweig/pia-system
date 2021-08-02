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
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { AlertService } from '../../_services/alert.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from '../../psa.app.core/models/user';
import { DialogPopUpComponent } from 'src/app/_helpers/dialog-pop-up';
import { ReplaySubject } from 'rxjs';
import {
  StudyAccess,
  UserWithStudyAccess,
} from 'src/app/psa.app.core/models/user-with-study-access';

@Component({
  selector: 'dialog-new-pseudonym',
  styleUrls: ['new-pseudonym-dialog.scss'],
  templateUrl: 'new-pseudonym-dialog.html',
})
export class DialogNewPseudonymComponent implements OnInit {
  form: FormGroup;
  currentRole: string;
  studies: string[];
  forcedSelectedStudies: string[];
  selectedStudies: string[] = [];
  filteredStudiesArray = [];
  isLoading: boolean = false;

  public studiesFilterCtrl: FormControl = new FormControl();
  public filteredStudies: ReplaySubject<string[]> = new ReplaySubject<string[]>(
    1
  );

  constructor(
    public dialogRef: MatDialogRef<DialogNewPseudonymComponent>,
    private authService: AuthService,
    private alertService: AlertService,
    private questionnaireService: QuestionnaireService,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const jwtHelper: JwtHelperService = new JwtHelperService();
    const currentUser: User = JSON.parse(localStorage.getItem('currentUser'));
    const tokenPayload = jwtHelper.decodeToken(currentUser.token);
    this.currentRole = tokenPayload.role;
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.questionnaireService.getStudies().then(
      async (result: any) => {
        // Add array of studies which are assigned to IDS and cannot be changed
        const idsUser: User & UserWithStudyAccess =
          await this.authService.getUser(this.data.ids);
        this.forcedSelectedStudies = idsUser.study_accesses.map(
          (sa: StudyAccess) => sa.study_id
        );
        // Hard coded filtering of ZIFCO-Studie and already assigned studies
        this.studies = result.studies
          .map((study) => study.name)
          .filter(
            (name) =>
              name !== 'ZIFCO-Studie' &&
              this.forcedSelectedStudies.findIndex(
                (forced_name) => forced_name === name
              ) === -1
          );
        this.filteredStudiesArray = this.studies;
        this.filteredStudies.next(this.filteredStudiesArray);
        this.isLoading = false;

        this.form = new FormGroup({
          pseudonym: new FormControl('', Validators.required),
          compliance_labresults: new FormControl(false, Validators.required),
          compliance_samples: new FormControl(false, Validators.required),
          compliance_bloodsamples: new FormControl(false, Validators.required),
          study_center: new FormControl('', Validators.required),
          examination_wave: new FormControl(1, Validators.required),
          study_accesses: new FormControl(this.forcedSelectedStudies),
        });

        this.form.get('study_accesses').valueChanges.subscribe(() => {
          this.selectedStudies = this.form
            .get('study_accesses')
            .value.filter(
              (name) =>
                this.forcedSelectedStudies.findIndex(
                  (forced_name) => forced_name === name
                ) === -1
            );
        });

        this.studiesFilterCtrl.valueChanges.subscribe(() => {
          this.filterStudies();
        });
        this.isLoading = false;
      },
      (err: any) => {
        this.isLoading = false;
        this.alertService.errorObject(err);
      }
    );
  }

  private filterStudies(): void {
    this.filteredStudies.next(this.studies);
    if (!this.studies) {
      return;
    }
    let search = this.studiesFilterCtrl.value;
    if (!search) {
      this.filteredStudiesArray = this.studies;
      this.filteredStudies.next(this.studies.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    this.filteredStudiesArray = this.studies.filter(
      (study) => study.toLowerCase().indexOf(search) > -1
    );
    this.filteredStudies.next(this.filteredStudiesArray);
  }

  submit(form): void {
    form.value['ids'] = this.data.ids;
    this.authService.postProband(form.value).then(
      (result: any) => {
        this.dialogRef.close(result);
      },
      (err: any) => {
        this.dialog.open(DialogPopUpComponent, {
          width: '500px',
          data: {
            data: '',
            content: 'DIALOG.ADD_PSEUDONYM_ERROR',
            isSuccess: false,
          },
        });
      }
    );
  }
}
