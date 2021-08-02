/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { ReplaySubject } from 'rxjs';
import { AlertService } from 'src/app/_services/alert.service';
import { DialogPopUpComponent } from 'src/app/_helpers/dialog-pop-up';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationManager } from '../../_services/authentication-manager.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-dialog-new-sormas-proband',
  templateUrl: 'new-sormas-proband-dialog.component.html',
  styleUrls: ['new-sormas-proband-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DialogNewSormasProbandComponent implements OnInit {
  form: FormGroup;
  studies: string[];
  filteredStudiesArray = [];
  firstname: string;
  lastname: string;
  email: string;
  pseudonym: string;
  isLoading: boolean;
  currentRole: string;

  public studiesFilterCtrl: FormControl = new FormControl();
  public filteredStudies: ReplaySubject<string[]> = new ReplaySubject<string[]>(
    1
  );
  private currentUser: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private route: ActivatedRoute,
    public dialogRef: MatDialogRef<DialogNewSormasProbandComponent>,
    private authService: AuthService,
    private alertService: AlertService,
    public dialog: MatDialog,
    private questionnaireService: QuestionnaireService,
    private auth: AuthenticationManager,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.currentUser.username;
    this.currentRole = this.auth.currentRole;
    this.isLoading = true;
    this.questionnaireService.getStudies().then(
      (result: any) => {
        this.studies = result.studies.map((study) => study.name);
        this.filteredStudiesArray = this.studies;
        this.filteredStudies.next(this.filteredStudiesArray);
        this.isLoading = false;

        this.form = new FormGroup({
          compliance_labresults: new FormControl(false, Validators.required),
          compliance_samples: new FormControl(false, Validators.required),
          compliance_bloodsamples: new FormControl(false, Validators.required),
          study_center: new FormControl('', Validators.required),
          examination_wave: new FormControl(1, Validators.required),
          study_accesses: new FormControl(null, Validators.required),
        });

        this.studiesFilterCtrl.valueChanges.subscribe(() => {
          this.filterStudies();
        });
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
    // get the search keyword
    let search = this.studiesFilterCtrl.value;
    if (!search) {
      this.filteredStudiesArray = this.studies;
      this.filteredStudies.next(this.studies.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the questionnaires
    this.filteredStudiesArray = this.studies.filter(
      (study) => study.toLowerCase().indexOf(search) > -1
    );
    this.filteredStudies.next(this.filteredStudiesArray);
  }

  onSelectAllStudiesClicked(): void {
    const studiesNameArray = [];
    if (
      this.form.controls['study_accesses'].value[0] === 'allStudiesCheckbox' &&
      this.form.controls['study_accesses'].value.length !==
        this.filteredStudiesArray.length + 1
    ) {
      studiesNameArray.push('allStudiesCheckbox');
      for (const study of this.filteredStudiesArray) {
        studiesNameArray.push(study);
      }
    }
    this.form.controls['study_accesses'].setValue(studiesNameArray);
  }

  async submit(form): Promise<void> {
    if (
      this.form.controls['study_accesses'].value &&
      this.form.controls['study_accesses'].value[0] === 'allStudiesCheckbox'
    ) {
      this.form.controls['study_accesses'].value.shift();
    }

    try {
      if (this.data.email) {
        form.value.email = this.data.email;
      }
      if (this.data.uuid) {
        form.value.uuid = this.data.uuid;
      }

      const postProbandResult = await this.authService.postSormasProband(
        form.value
      );

      this.dialogRef.close({ result: postProbandResult, isSuccess: true });

      this.dialog.open(DialogPopUpComponent, {
        width: '500px',
        panelClass: 'new-sormas-proband-password-dialog',
        data: {
          values: postProbandResult,
          content:
            postProbandResult.password === null
              ? 'SORMAS.NEW_PROBAND_SUCCESS_MESSAGE'
              : 'SORMAS.NEW_PROBAND_SUCCESS_WITH_EMAIL_ERROR_MESSAGE',
          isSuccess: true,
        },
      });
    } catch (err) {
      let dialogContent = 'DIALOG.CREATE_PROBAND_ERROR';
      if (err.status === 409) {
        if (err.error.message && err.error.message.includes('UUID')) {
          dialogContent = 'DIALOG.CREATE_PROBAND_ERROR_CONFLICT';
        }
      }
      if (err.status === 400) {
        if (err.error.message && err.error.message.includes('email')) {
          dialogContent = 'SORMAS.PROBAND_EMAIL_NOT_VALID_ERROR';
        }
      }
      this.dialog.open(DialogPopUpComponent, {
        width: '500px',
        data: {
          content: dialogContent,
          isSuccess: false,
        },
      });
    }
  }
}
