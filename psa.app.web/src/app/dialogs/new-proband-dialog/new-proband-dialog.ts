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
import { AlertService } from '../../_services/alert.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import {
  DialogPopUpComponent,
  DialogPopUpData,
} from 'src/app/_helpers/dialog-pop-up';
import { Observable } from 'rxjs';
import { CreateProbandRequest } from '../../psa.app.core/models/proband';
import { UserWithStudyAccess } from '../../psa.app.core/models/user-with-study-access';
import { map, shareReplay, startWith } from 'rxjs/operators';

export interface DialogNewProbandComponentData {
  ids: string;
}

@Component({
  selector: 'dialog-new-proband',
  styleUrls: ['new-proband-dialog.scss'],
  templateUrl: 'new-proband-dialog.html',
})
export class DialogNewProbandComponent implements OnInit {
  public form: FormGroup;
  public isLoading: boolean = false;
  public studiesFilterCtrl: FormControl = new FormControl('');
  public filteredStudies: Observable<string[]>;

  public constructor(
    private dialogRef: MatDialogRef<DialogNewProbandComponent>,
    private authService: AuthService,
    private alertService: AlertService,
    private questionnaireService: QuestionnaireService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data?: DialogNewProbandComponentData
  ) {
    this.form = new FormGroup({
      pseudonym: new FormControl('', Validators.required),
      complianceLabresults: new FormControl(false, Validators.required),
      complianceSamples: new FormControl(false, Validators.required),
      complianceBloodsamples: new FormControl(false, Validators.required),
      studyCenter: new FormControl('', Validators.required),
      examinationWave: new FormControl(1, Validators.required),
      studyName: new FormControl(null, Validators.required),
    });
  }

  public async ngOnInit(): Promise<void> {
    this.isLoading = true;
    let studies: string[] = [];
    try {
      if (this.data) {
        const idsUser: UserWithStudyAccess = await this.authService.getUser(
          this.data.ids
        );
        studies = idsUser.study_accesses.map((sa) => sa.study_id);
      } else {
        const result = await this.questionnaireService.getStudies();
        // Hard coded filtering of ZIFCO-Studie
        studies = result.studies
          .map((study) => study.name)
          .filter((name) => name !== 'ZIFCO-Studie');
      }
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.filteredStudies = this.createStudiesFilterObservable(studies);
    this.isLoading = false;
  }

  private createStudiesFilterObservable(
    studies: string[]
  ): Observable<string[]> {
    return this.studiesFilterCtrl.valueChanges.pipe(
      startWith(this.studiesFilterCtrl.value as string),
      map((filterValue) => filterValue.toLowerCase()),
      map((filterValue) => {
        if (!filterValue) {
          return studies;
        } else {
          return studies.filter((study) =>
            study.toLowerCase().includes(filterValue)
          );
        }
      }),
      shareReplay(1)
    );
  }

  public async submit(): Promise<void> {
    try {
      const payload: CreateProbandRequest = {
        pseudonym: this.form.get('pseudonym').value,
        complianceBloodsamples: this.form.get('complianceBloodsamples').value,
        complianceLabresults: this.form.get('complianceLabresults').value,
        complianceSamples: this.form.get('complianceSamples').value,
        examinationWave: this.form.get('examinationWave').value,
        studyCenter: this.form.get('studyCenter').value,
      };
      if (this.data) {
        payload.ids = this.data.ids;
      }
      await this.authService.postProband(
        payload,
        this.form.get('studyName').value
      );
      this.dialogRef.close(payload.pseudonym);
    } catch (err) {
      this.dialog.open<DialogPopUpComponent, DialogPopUpData>(
        DialogPopUpComponent,
        {
          width: '500px',
          data: {
            content: 'DIALOG.CREATE_PROBAND_ERROR',
            isSuccess: false,
          },
        }
      );
    }
  }
}
